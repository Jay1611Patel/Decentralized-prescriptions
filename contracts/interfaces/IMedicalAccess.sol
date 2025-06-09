// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMedicalAccess {
    // Struct Definitions
    struct DoctorProfile {
        string licenseHash;
        uint256 expiryDate;
        string name;
        string specialization;
        bool isActive;
    }

    struct PharmacistProfile {
        string pharmacyId;
        string pharmacyName;
        bool isVerified;
    }

    // Events
    event DoctorRegistered(
        address indexed doctor,
        string licenseHash,
        uint256 expiry
    );

    struct AccessRequest {
        uint256 id;
        address doctor;
        address patient;
        string doctorName;
        string hospital;
        uint256 timestamp;
        bool fulfilled;
    }

    event DoctorUpdated(address indexed doctor);
    event DoctorRevoked(address indexed doctor);
    event PharmacistRegistered(address indexed pharmacist, string pharmacyId);
    event PharmacistRevoked(address indexed pharmacist);
    event PatientRegistered(address indexed account);
    event PauseToggled(bool isPaused);
    event RoleRevokedWithSender(bytes32 indexed role, address indexed account);
    event DataStored(address indexed patient, string cid);
    event AccessRequested(
        uint256 indexed requestId,
        address indexed doctor,
        address indexed patient
    );
    event AccessApproved(
        uint256 indexed requestId,
        address indexed doctor,
        address indexed patient
    );
    event AccessRevoked(address indexed doctor, address indexed patient);

    // Role Constants
    function DOCTOR_ROLE() external pure returns (bytes32);

    function PHARMACIST_ROLE() external pure returns (bytes32);

    function ADMIN_ROLE() external pure returns (bytes32);

    function PATIENT_ROLE() external view returns (bytes32);

    // Role Verification
    function isActive(address doctorAddress) external view returns (bool);

    function isVerifiedPharmacist(
        address pharmacistAddress
    ) external view returns (bool);

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    function requestAccess(
        address patient,
        string memory doctorName,
        string memory hospital
    ) external;

    function approveAccess(
        uint256 requestId,
        bytes memory encryptedKey
    ) external;

    function revokeAccess(address doctor) external;

    function storeDataCID(string calldata cid) external;

    // Getters
    function getDoctor(
        address doctorAddress
    ) external view returns (DoctorProfile memory);

    function getPharmacist(
        address pharmacistAddress
    ) external view returns (PharmacistProfile memory);

    function getAllDoctors() external view returns (address[] memory);

    function getAllPharmacists() external view returns (address[] memory);

    function getDoctorCount() external view returns (uint256);

    function getPharmacistCount() external view returns (uint256);

    // Registration Functions
    function registerDoctor(
        address doctorAddress,
        string memory licenseHash,
        uint256 licenseExpiry,
        string memory name,
        string memory specialization
    ) external;

    function revokeDoctor(address doctorAddress) external;

    function registerPharmacist(
        address pharmacistAddress,
        string memory pharmacyId,
        string memory pharmacyName
    ) external;

    function revokePharmacist(address pharmacistAddress) external;

    function registerPatient() external;

    // function renewDoctorLicense(
    //     address doctorAddress,
    //     uint256 newExpiry
    // ) external;

    // System Controls
    function togglePause(uint256 durationHours) external;

    function getPatientCID(
        address patient
    ) external view returns (string memory);

    function getAccessRequests(
        address patient
    ) external view returns (AccessRequest[] memory);

    function emergencyPause() external view returns (bool);
}
