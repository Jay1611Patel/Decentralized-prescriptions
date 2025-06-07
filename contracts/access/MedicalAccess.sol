// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMedicalAccess.sol";

contract MedicalAccess is AccessControl, IMedicalAccess {
    // Constants
    bytes32 public constant override DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant override ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant override PHARMACIST_ROLE =
        keccak256("PHARMACIST_ROLE");
    bytes32 public constant override PATIENT_ROLE = keccak256("PATIENT_ROLE");

    //Storage
    // doctorRegistry[address] = DoctorProfile("QmXYZ", 1735689600, true);
    // (string memory hash, uint256 expiry, bool active) = doctorRegistry(0x123...);
    mapping(address => DoctorProfile) public doctorRegistry;
    mapping(address => PharmacistProfile) public pharmacistRegistry;
    mapping(address => bool) public patientRegistry;
    mapping(address => string) private patientDataCIDs;
    mapping(address => AccessRequest[]) private accessRequests;
    mapping(address => mapping(address => bytes)) private accessKeys;
    uint256 private nextRequestId;

    address[] public doctorList;
    address[] public pharmacistList;
    mapping(address => uint256) private doctorIndex;
    mapping(address => uint256) private pharmacistIndex;

    bool public emergencyPause;
    uint256 public pauseExpiry;

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender); // Deployer becomes admin
        _setRoleAdmin(DOCTOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PHARMACIST_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PATIENT_ROLE, ADMIN_ROLE);
    }

    // modifier
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an Admin");
        _;
    }

    modifier notPaused() {
        if (emergencyPause && block.timestamp >= pauseExpiry) {
            emergencyPause = false; // Auto-expire
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
            !doctorRegistry[doctorAddress].isActive,
            "Doctor already registered"
        );
        _grantRole(DOCTOR_ROLE, doctorAddress);
        doctorRegistry[doctorAddress] = DoctorProfile({
            licenseHash: licenseHash,
            expiryDate: licenseExpiry,
            name: name,
            specialization: specialization,
            isActive: true
        });
        doctorList.push(doctorAddress);
        doctorIndex[doctorAddress] = doctorList.length;
        emit DoctorRegistered(doctorAddress, licenseHash, licenseExpiry);
    }

    function revokeDoctor(
        address doctorAddress
    ) external override onlyAdmin notPaused {
        uint256 index = doctorIndex[doctorAddress];
        require(index > 0, "Not an active doctor");
        require(doctorRegistry[doctorAddress].isActive, "Not an active doctor");

        doctorList[index - 1] = doctorList[doctorList.length - 1];
        doctorIndex[doctorList[index - 1]] = index; // Update swapped item
        doctorList.pop();
        doctorIndex[doctorAddress] = 0;

        _revokeRole(DOCTOR_ROLE, doctorAddress);
        doctorRegistry[doctorAddress].isActive = false;
        emit DoctorRevoked(doctorAddress);
    }

    function registerPharmacist(
        address pharmacistAddress,
        string memory pharmacyId,
        string memory pharmacyName
    ) external override onlyAdmin notPaused {
        require(pharmacistAddress != address(0), "Invalid Address");
        require(
            !pharmacistRegistry[pharmacistAddress].isVerified,
            "Pharmacist already Registered"
        );
        _grantRole(PHARMACIST_ROLE, pharmacistAddress);
        pharmacistRegistry[pharmacistAddress] = PharmacistProfile({
            pharmacyId: pharmacyId,
            pharmacyName: pharmacyName,
            isVerified: true
        });
        pharmacistList.push(pharmacistAddress);
        pharmacistIndex[pharmacistAddress] = pharmacistList.length;
        emit PharmacistRegistered(pharmacistAddress, pharmacyId);
    }

    function revokePharmacist(
        address pharmacistAddress
    ) external override onlyAdmin {
        uint256 index = pharmacistIndex[pharmacistAddress];
        require(index > 0, "Pharmacist not registered");
        require(
            pharmacistRegistry[pharmacistAddress].isVerified,
            "Pharmacist not verified"
        );

        pharmacistList[index - 1] = pharmacistList[pharmacistList.length - 1];
        pharmacistIndex[pharmacistList[index - 1]] = index; // Update swapped item
        pharmacistList.pop();
        pharmacistIndex[pharmacistAddress] = 0;

        _revokeRole(PHARMACIST_ROLE, pharmacistAddress);
        emit PharmacistRevoked(pharmacistAddress);
    }

    function registerPatient() external override notPaused {
        require(!patientRegistry[msg.sender], "Already registered");

        // Clear any existing role first
        if (hasRole(PATIENT_ROLE, msg.sender)) {
            _revokeRole(PATIENT_ROLE, msg.sender);
        }

        _grantRole(PATIENT_ROLE, msg.sender);
        patientRegistry[msg.sender] = true;
        emit PatientRegistered(msg.sender);
    }

    function requestAccess(
        address patient,
        string memory doctorName,
        string memory hospital
    ) external override onlyRole(DOCTOR_ROLE) {
        uint256 requestId = nextRequestId++;
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

    function storeDataCID(
        string calldata cid
    ) external override onlyRole(PATIENT_ROLE) {
        patientDataCIDs[msg.sender] = cid;
        emit DataStored(msg.sender, cid);
    }

    function revokeAccess(address doctor) external override {
        delete accessKeys[msg.sender][doctor];
        emit AccessRevoked(doctor, msg.sender);
    }

    // function renewDoctorLicense(
    //     address doctorAddress,
    //     uint256 newExpiry
    // ) external override onlyAdmin notPaused {
    //     require(newExpiry > block.timestamp, "Invalid expiry date");
    //     doctorRegistry[doctorAddress].expiryDate = newExpiry;
    // }

    function togglePause(uint256 durationHours) external override onlyAdmin {
        emergencyPause = !emergencyPause;
        pauseExpiry = emergencyPause
            ? block.timestamp + (durationHours * 1 hours)
            : 0;
        emit PauseToggled(emergencyPause);
    }

    //utils
    function isActive(
        address doctorAddress
    ) external view override returns (bool) {
        DoctorProfile memory doc = doctorRegistry[doctorAddress];
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
            pharmacistRegistry[account].isVerified;
    }

    function revokeRole(
        bytes32 role,
        address account
    ) public override onlyRole(getRoleAdmin(role)) {
        super.revokeRole(role, account);
        emit RoleRevokedWithSender(role, account);
    }

    function getAllDoctors() external view override returns (address[] memory) {
        return doctorList;
    }

    function getAllPharmacists()
        external
        view
        override
        returns (address[] memory)
    {
        return pharmacistList;
    }

    function getDoctorCount() external view override returns (uint256) {
        return doctorList.length;
    }

    function getPharmacistCount() external view override returns (uint256) {
        return pharmacistList.length;
    }

    function getDoctor(
        address doctorAddress
    ) external view override returns (DoctorProfile memory) {
        return doctorRegistry[doctorAddress];
    }

    function getPharmacist(
        address pharmacistAddress
    ) external view override returns (PharmacistProfile memory) {
        return pharmacistRegistry[pharmacistAddress];
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

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return
            interfaceId == type(IMedicalAccess).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
