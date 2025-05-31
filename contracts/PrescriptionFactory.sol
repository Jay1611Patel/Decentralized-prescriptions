// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./access/MedicalAccess.sol";
import "./prescription/PrescriptionRegistry.sol";
import "./tokens/PrescriptionToken.sol";
import "hardhat/console.sol";

/**
 * @title Prescription System Factory
 * @dev Deploys and connects all components of the decentralized prescription system
 */
contract PrescriptionFactory {
    MedicalAccess public immutable medicalAccess;
    PrescriptionRegistry public immutable prescriptionRegistry;
    PrescriptionToken public immutable prescriptionToken;

    event SystemDeployed(
        address indexed medicalAccess,
        address indexed registry,
        address indexed token,
        address deployer
    );

    /**
     * @dev Deploys the entire prescription system
     * @param baseTokenURI Base URI for prescription NFTs (e.g., "ipfs://Qm.../")
     */
    constructor(string memory baseTokenURI) {
        // Deploy access control first
        medicalAccess = new MedicalAccess();

        // Deploy registry with medical access reference
        prescriptionRegistry = new PrescriptionRegistry(
            address(medicalAccess),
            address(0),
            address(0)
        );

        // Deploy the ERC-721 prescription token
        prescriptionToken = new PrescriptionToken(baseTokenURI);

        // Configure permissions:
        // 1. Allow registry to mint/burn tokens
        prescriptionToken.grantRole(
            prescriptionToken.MINTER_ROLE(),
            address(prescriptionRegistry)
        );
        prescriptionToken.grantRole(
            prescriptionToken.BURNER_ROLE(),
            address(prescriptionRegistry)
        );

        // 2. Make factory deployer the default admin
        medicalAccess.grantRole(medicalAccess.ADMIN_ROLE(), msg.sender);

        emit SystemDeployed(
            address(medicalAccess),
            address(prescriptionRegistry),
            address(prescriptionToken),
            msg.sender
        );
    }

    /**
     * @dev Returns addresses of all deployed contracts
     */
    function getSystemAddresses()
        external
        view
        returns (address accessControl, address registry, address token)
    {
        return (
            address(medicalAccess),
            address(prescriptionRegistry),
            address(prescriptionToken)
        );
    }
}
