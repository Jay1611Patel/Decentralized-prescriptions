// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPrescriptionRegistry {
    struct Prescription {
        address doctor;
        address patient;
        uint256 issueDate;
        uint256 expiryDate;
        string prescriptionHash;
        bool isFulfilled;
        address fulfilledBy;
        uint256 fulfillmentDate;
    }

    event PrescriptionCreated(
        uint256 indexed prescriptionId,
        address indexed doctor,
        address indexed patient
    );
    event PrescriptionFulfilled(
        uint256 indexed prescriptionId,
        address indexed pharmacist
    );

    function createPrescription(
        address patient,
        uint256 expiryDate,
        string calldata prescriptionHash
    ) external;

    function fulfillPrescription(uint256 prescriptionId) external;

    function getPrescription(
        uint256 prescriptionId
    ) external view returns (Prescription memory);

    function getPatientPrescriptions(
        address patient
    ) external view returns (uint256[] memory);

    function getDoctorPrescriptions(
        address doctor
    ) external view returns (uint256[] memory);

    function getPrescriptionCount() external view returns (uint256);
}
