// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMedicalAccess.sol";
import "../interfaces/IPrescriptionRegistry.sol";
import "../interfaces/IPrescriptionToken.sol";
import "hardhat/console.sol";

contract PrescriptionRegistry is AccessControl, IPrescriptionRegistry {
    IMedicalAccess public medicalAccess;
    IPrescriptionToken public prescriptionToken;

    uint256 public prescriptionCount;
    mapping(uint256 => Prescription) private _prescriptions;
    mapping(address => uint256[]) private _patientPrescriptions;
    mapping(address => uint256[]) private _doctorPrescriptions;

    constructor(address _medicalAccess) {
        medicalAccess = IMedicalAccess(_medicalAccess);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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
    ) external override {
        require(medicalAccess.isActive(msg.sender), "Unauthorized");
        require(expiryDate > block.timestamp, "Invalid expiry");
        require(
            medicalAccess.hasRole(medicalAccess.PATIENT_ROLE(), patient),
            "Invalid patient"
        );
        console.log("-----------------");

        uint256 newId = ++prescriptionCount;
        _prescriptions[newId] = Prescription({
            doctor: msg.sender,
            patient: patient,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            prescriptionHash: prescriptionHash,
            isFulfilled: false,
            fulfilledBy: address(0),
            fulfillmentDate: 0
        });

        _patientPrescriptions[patient].push(newId);
        _doctorPrescriptions[msg.sender].push(newId);

        if (address(prescriptionToken) != address(0)) {
            prescriptionToken.mint(patient, newId, prescriptionHash);
        }

        emit PrescriptionCreated(newId, msg.sender, patient);
    }

    function fulfillPrescription(uint256 prescriptionId) external override {
        require(medicalAccess.isVerifiedPharmacist(msg.sender), "Unauthorized");
        Prescription storage prescription = _prescriptions[prescriptionId];
        require(prescription.doctor != address(0), "Invalid prescription");
        require(!prescription.isFulfilled, "Already fulfilled");
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
