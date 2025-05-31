// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMedicalAccess.sol";
import "../interfaces/IPrescriptionRegistry.sol";
import "../interfaces/IPrescriptionToken.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract PrescriptionRegistry is AccessControl, IPrescriptionRegistry {
    IMedicalAccess public medicalAccess;
    IPrescriptionToken public prescriptionToken;

    uint256 public prescriptionCount;
    mapping(uint256 => Prescription) _prescriptions;
    mapping(address => uint256[]) _patientPrescriptions;
    mapping(address => uint256[]) private _doctorPrescriptions;

    bytes32 public constant PHARMACIST_ROLE = keccak256("PHARMACIST_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");

    constructor(
        address _medicalAccess,
        address doctorAddress,
        address pharmacistAddress
    ) {
        medicalAccess = IMedicalAccess(_medicalAccess);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DOCTOR_ROLE, doctorAddress);
        _grantRole(PHARMACIST_ROLE, pharmacistAddress);
        _setRoleAdmin(DOCTOR_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PHARMACIST_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function setPrescriptionToken(
        address _prescriptionToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        prescriptionToken = IPrescriptionToken(_prescriptionToken);
    }

    function createPrescription(
        address patient,
        uint256 expiryDate,
        string calldata prescriptionHash
    ) external override onlyRole(DOCTOR_ROLE) {
        require(
            medicalAccess.isActive(msg.sender),
            "Only active doctors can create prescription"
        );
        require(
            expiryDate > block.timestamp,
            "Expiry date should be in future"
        );
        require(
            medicalAccess.hasRole(medicalAccess.PATIENT_ROLE(), patient),
            "Patient not registered"
        );
        require(patient != address(0), "Invalid Patient Address");
        require(
            bytes(prescriptionHash).length > 0,
            "Invalid Prescription Hash"
        );
        prescriptionCount++;
        uint256 newPrescriptionId = prescriptionCount;

        _prescriptions[newPrescriptionId] = Prescription({
            doctor: msg.sender,
            patient: patient,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            prescriptionHash: prescriptionHash,
            isFulfilled: false,
            fulfilledBy: address(0),
            fulfillmentDate: 0
        });

        _patientPrescriptions[patient].push(newPrescriptionId);
        _doctorPrescriptions[msg.sender].push(newPrescriptionId);

        if (address(prescriptionToken) != address(0)) {
            string memory tokenURI = string(
                abi.encodePacked(
                    "prescription:",
                    Strings.toString(newPrescriptionId),
                    ",doctor:",
                    Strings.toHexString(uint160(msg.sender), 20),
                    ",patient:",
                    Strings.toHexString(uint160(patient), 20)
                )
            );
            prescriptionToken.mint(patient, newPrescriptionId, tokenURI);
        }
        emit PrescriptionCreated(newPrescriptionId, msg.sender, patient);
    }

    function fulfillPrescription(uint256 prescriptionId) external override {
        require(
            medicalAccess.isVerifiedPharmacist(msg.sender),
            "Not a verified Pharmacist"
        );
        Prescription storage prescription = _prescriptions[prescriptionId];
        require(
            prescription.doctor != address(0),
            "Prescription does not exist"
        );
        require(
            prescription.patient != address(0),
            "Prescription doesn't exist"
        );
        require(!prescription.isFulfilled, "Prescription is fulfilled");
        require(
            prescription.expiryDate > block.timestamp,
            "Prescription expired"
        );

        prescription.isFulfilled = true;
        prescription.fulfilledBy = msg.sender;
        prescription.fulfillmentDate = block.timestamp;

        if (address(prescriptionToken) != address(0)) {
            prescriptionToken.burn(prescriptionId);
        }
        emit PrescriptionFulfilled(prescriptionId, msg.sender);
    }

    function getPrescription(
        uint256 prescriptionId
    ) external view override returns (Prescription memory) {
        return _prescriptions[prescriptionId];
    }

    function getPatientPrescriptions(
        address patient
    ) external view override returns (uint256[] memory) {
        return _patientPrescriptions[patient];
    }

    function getDoctorPrescriptions(
        address doctor
    ) external view override returns (uint256[] memory) {
        return _doctorPrescriptions[doctor];
    }

    function getPrescriptionCount() external view override returns (uint256) {
        return prescriptionCount;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return
            interfaceId == type(IPrescriptionRegistry).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
