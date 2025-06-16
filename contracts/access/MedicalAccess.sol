// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMedicalAccess.sol";
import "../libraries/PermissionsLib.sol";
import "../libraries/RegistryLib.sol";

contract MedicalAccess is AccessControl, IMedicalAccess {
    using PermissionsLib for PermissionsLib.AccessPermissionStorage;
    using RegistryLib for RegistryLib.DoctorRegistry;
    using RegistryLib for RegistryLib.PharmacistRegistry;

    // Constants
    bytes32 public constant override DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant override ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant override PHARMACIST_ROLE =
        keccak256("PHARMACIST_ROLE");
    bytes32 public constant override PATIENT_ROLE = keccak256("PATIENT_ROLE");

    // Storage
    PermissionsLib.AccessPermissionStorage private permissions;
    RegistryLib.DoctorRegistry private doctors;
    RegistryLib.PharmacistRegistry private pharmacists;

    mapping(address => bool) public patientRegistry;
    mapping(address => string) private patientDataCIDs;
    mapping(address => AccessRequest[]) private accessRequests;
    mapping(address => mapping(address => bytes)) private accessKeys;

    bool public override emergencyPause;
    uint256 public pauseExpiry;

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
        _setRoleAdmin(DOCTOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PHARMACIST_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PATIENT_ROLE, ADMIN_ROLE);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an Admin");
        _;
    }

    modifier notPaused() {
        if (emergencyPause && block.timestamp >= pauseExpiry) {
            emergencyPause = false;
        }
        require(!emergencyPause, "Contract paused");
        _;
    }

    function hasRole(
        bytes32 role,
        address account
    ) public view override(AccessControl, IMedicalAccess) returns (bool) {
        return super.hasRole(role, account);
    }

    function registerDoctor(
        address doctorAddress,
        string memory licenseHash,
        uint256 licenseExpiry,
        string memory name,
        string memory specialization
    ) external override onlyAdmin notPaused {
        require(licenseExpiry > block.timestamp, "License Expired");
        require(bytes(licenseHash).length > 0, "Invalid License");
        require(doctorAddress != address(0), "Invalid Address");
        require(bytes(name).length > 0, "Name required");
        require(bytes(specialization).length > 0, "Specialization required");
        require(
            !doctors.doctorRegistry[doctorAddress].isActive,
            "Doctor already registered"
        );

        _grantRole(DOCTOR_ROLE, doctorAddress);
        doctors.registerDoctor(
            doctorAddress,
            licenseHash,
            licenseExpiry,
            name,
            specialization
        );
        emit DoctorRegistered(doctorAddress, licenseHash, licenseExpiry);
    }

    function revokeDoctor(
        address doctorAddress
    ) external override onlyAdmin notPaused {
        doctors.revokeDoctor(doctorAddress);
        _revokeRole(DOCTOR_ROLE, doctorAddress);
        emit DoctorRevoked(doctorAddress);
    }

    function registerPharmacist(
        address pharmacistAddress,
        string memory pharmacyId,
        string memory pharmacyName
    ) external override onlyAdmin notPaused {
        require(pharmacistAddress != address(0), "Invalid Address");
        require(
            !pharmacists.pharmacistRegistry[pharmacistAddress].isVerified,
            "Pharmacist already Registered"
        );

        _grantRole(PHARMACIST_ROLE, pharmacistAddress);
        pharmacists.registerPharmacist(
            pharmacistAddress,
            pharmacyId,
            pharmacyName
        );
        emit PharmacistRegistered(pharmacistAddress, pharmacyId);
    }

    function revokePharmacist(
        address pharmacistAddress
    ) external override onlyAdmin {
        pharmacists.revokePharmacist(pharmacistAddress);
        _revokeRole(PHARMACIST_ROLE, pharmacistAddress);
        emit PharmacistRevoked(pharmacistAddress);
    }

    function registerPatient() external override notPaused {
        require(!patientRegistry[msg.sender], "Patient already registered");
        _grantRole(PATIENT_ROLE, msg.sender);
        patientRegistry[msg.sender] = true;
        emit PatientRegistered(msg.sender);
    }

    function grantTemporaryAccess(
        address doctor,
        string[] calldata dataFields,
        uint256 duration
    ) external override onlyRole(PATIENT_ROLE) {
        require(hasRole(DOCTOR_ROLE, doctor), "Not a valid doctor");
        require(duration > 0, "Duration must be positive");

        uint256 requestId = permissions.grantTemporaryAccess(
            doctor,
            msg.sender,
            dataFields,
            duration
        );
        emit TemporaryAccessGranted(
            requestId,
            doctor,
            msg.sender,
            block.timestamp + duration,
            dataFields
        );
    }

    function extendAccess(
        uint256 requestId,
        address doctor,
        uint256 additionalDuration
    ) external override {
        permissions.extendAccess(
            doctor,
            msg.sender,
            requestId,
            additionalDuration
        );
        emit AccessExtended(requestId, block.timestamp + additionalDuration);
    }

    function revokeAccessEarly(
        uint256 requestId,
        address doctor
    ) external override {
        permissions.revokeAccessEarly(doctor, msg.sender, requestId);
        emit AccessRevokedEarly(requestId);
    }

    function requestAccess(
        address patient,
        string memory doctorName,
        string memory hospital
    ) external override onlyRole(DOCTOR_ROLE) {
        uint256 requestId = permissions.nextRequestId;
        accessRequests[patient].push(
            AccessRequest({
                id: requestId,
                doctor: msg.sender,
                patient: patient,
                doctorName: doctorName,
                hospital: hospital,
                timestamp: block.timestamp,
                fulfilled: false
            })
        );
        permissions.nextRequestId++;
        emit AccessRequested(requestId, msg.sender, patient);
    }

    function approveAccess(
        uint256 requestId,
        bytes memory encryptedKey
    ) external override {
        AccessRequest[] storage requests = accessRequests[msg.sender];
        for (uint i = 0; i < requests.length; i++) {
            if (requests[i].id == requestId) {
                requests[i].fulfilled = true;
                accessKeys[msg.sender][requests[i].doctor] = encryptedKey;
                emit AccessApproved(requestId, requests[i].doctor, msg.sender);
                return;
            }
        }
        revert("Request not found");
    }

    function revokeAccess(address doctor) external override {
        // Revoke all permissions for this doctor
        IMedicalAccess.AccessPermission[] storage patientPerms = permissions
            .patientPermissions[msg.sender];
        for (uint i = 0; i < patientPerms.length; i++) {
            if (patientPerms[i].doctor == doctor && patientPerms[i].isActive) {
                patientPerms[i].isActive = false;
                emit AccessRevokedEarly(patientPerms[i].requestId);
            }
        }

        delete accessKeys[msg.sender][doctor];
        emit AccessRevoked(doctor, msg.sender);
    }

    function storeDataCID(
        string calldata cid
    ) external override onlyRole(PATIENT_ROLE) {
        patientDataCIDs[msg.sender] = cid;
        emit DataStored(msg.sender, cid);
    }

    function togglePause(uint256 durationHours) external override onlyAdmin {
        emergencyPause = !emergencyPause;
        pauseExpiry = emergencyPause
            ? block.timestamp + (durationHours * 1 hours)
            : 0;
        emit PauseToggled(emergencyPause);
    }

    // View functions
    function isActive(
        address doctorAddress
    ) external view override returns (bool) {
        IMedicalAccess.DoctorProfile memory doc = doctors.doctorRegistry[
            doctorAddress
        ];
        return
            hasRole(DOCTOR_ROLE, doctorAddress) &&
            doc.isActive &&
            doc.expiryDate > block.timestamp;
    }

    function isVerifiedPharmacist(
        address account
    ) public view override returns (bool) {
        return
            hasRole(PHARMACIST_ROLE, account) &&
            pharmacists.pharmacistRegistry[account].isVerified;
    }

    function getDoctor(
        address doctorAddress
    ) external view override returns (DoctorProfile memory) {
        return doctors.getDoctor(doctorAddress);
    }

    function getPharmacist(
        address pharmacistAddress
    ) external view override returns (PharmacistProfile memory) {
        return pharmacists.getPharmacist(pharmacistAddress);
    }

    function getAllDoctors() external view override returns (address[] memory) {
        return doctors.getAllDoctors();
    }

    function getAllPharmacists()
        external
        view
        override
        returns (address[] memory)
    {
        return pharmacists.getAllPharmacists();
    }

    function getDoctorCount() external view override returns (uint256) {
        return doctors.getDoctorCount();
    }

    function getPharmacistCount() external view override returns (uint256) {
        return pharmacists.getPharmacistCount();
    }

    function getDoctorAccess()
        external
        view
        override
        returns (AccessPermission[] memory)
    {
        require(hasRole(DOCTOR_ROLE, msg.sender), "Caller is not a doctor");
        return permissions.getDoctorAccess(msg.sender);
    }

    function getPatientPermissions()
        external
        view
        override
        returns (AccessPermission[] memory)
    {
        require(hasRole(PATIENT_ROLE, msg.sender), "Caller is not a patient");
        return permissions.getPatientPermissions(msg.sender);
    }

    function getPatientCID(
        address patient
    ) external view override returns (string memory) {
        require(
            msg.sender == patient ||
                hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(DOCTOR_ROLE, msg.sender),
            "No access"
        );
        return patientDataCIDs[patient];
    }

    function getAccessRequests(
        address patient
    ) external view override returns (AccessRequest[] memory) {
        return accessRequests[patient];
    }

    function revokeRole(
        bytes32 role,
        address account
    ) public override onlyRole(getRoleAdmin(role)) {
        super.revokeRole(role, account);
        emit RoleRevokedWithSender(role, account);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return
            interfaceId == type(IMedicalAccess).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
