const { ethers, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()
const fs = require("fs") // Add this at the top with other requires
const path = require("path")

// Gas configuration
const GAS_SETTINGS = {
    gasLimit: 6_000_000, // Set a high enough gas limit
    gasPrice: ethers.parseUnits("10", "gwei"), // Set appropriate gas price
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()

    // Address zero handling
    const AddressZero = ethers.ZeroAddress
    const BASE_URI = process.env.IPFS_URI || "ipfs://default-uri/"

    log("\n============ Starting Deployment ============")
    log(`Network: ${network.name}`)
    log(`Deployer: ${deployer}`)
    log(`Base URI: ${BASE_URI}`)

    try {
        // 1. Deploy MedicalAccess with explicit gas settings
        log("\n1. Deploying MedicalAccess contract...")
        const medicalAccess = await deploy("MedicalAccess", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
            ...GAS_SETTINGS,
        })
        if (!medicalAccess.address)
            throw new Error("MedicalAccess deployment failed")
        log(`✅ MedicalAccess deployed to: ${medicalAccess.address}`)

        // Save the artifact to frontend
        const contractsDir = path.join(__dirname, "../frontend/src/abi")

        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir, { recursive: true })
        }

        const MedicalAccessArtifact = await artifacts.readArtifact(
            "MedicalAccess"
        )

        fs.writeFileSync(
            path.join(contractsDir, "MedicalAccess.json"),
            JSON.stringify(
                {
                    abi: MedicalAccessArtifact.abi,
                    bytecode: MedicalAccessArtifact.bytecode,
                    contractName: "MedicalAccess",
                    address: medicalAccess.address, // Include deployed address
                },
                null,
                2
            )
        )

        // 2. Deploy PrescriptionToken
        log("\n2. Deploying PrescriptionToken contract...")
        const prescriptionToken = await deploy("PrescriptionToken", {
            from: deployer,
            args: [BASE_URI],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
            ...GAS_SETTINGS,
        })
        if (!prescriptionToken.address)
            throw new Error("PrescriptionToken deployment failed")
        log(`✅ PrescriptionToken deployed to: ${prescriptionToken.address}`)

        // 3. Deploy PrescriptionRegistry
        log("\n3. Deploying PrescriptionRegistry contract...")
        const prescriptionRegistry = await deploy("PrescriptionRegistry", {
            from: deployer,
            args: [medicalAccess.address, AddressZero, AddressZero],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
            ...GAS_SETTINGS,
        })
        if (!prescriptionRegistry.address)
            throw new Error("PrescriptionRegistry deployment failed")
        log(
            `✅ PrescriptionRegistry deployed to: ${prescriptionRegistry.address}`
        )

        // 4. Initialize contracts with proper signer and gas settings
        log("\n4. Initializing contract instances...")
        const [signer] = await ethers.getSigners()

        const tokenContract = await ethers.getContractAt(
            "PrescriptionToken",
            prescriptionToken.address,
            signer
        )

        const registryContract = await ethers.getContractAt(
            "PrescriptionRegistry",
            prescriptionRegistry.address,
            signer
        )

        // 5. Configure roles with gas management
        log("\n5. Configuring system roles...")

        // Get role hashes with error handling
        let minterRole, burnerRole
        try {
            minterRole = await tokenContract.MINTER_ROLE()
            burnerRole = await tokenContract.BURNER_ROLE()
            if (!minterRole || !burnerRole)
                throw new Error("Invalid role hashes")
        } catch (roleError) {
            throw new Error(`Failed to get role hashes: ${roleError.message}`)
        }

        // Grant MINTER role with explicit gas settings
        log("Granting MINTER role to Registry...")
        try {
            const grantMinterTx = await tokenContract.grantRole(
                minterRole,
                registryContract.target,
                GAS_SETTINGS
            )
            await grantMinterTx.wait()
            log("✅ MINTER role granted")
        } catch (minterError) {
            throw new Error(
                `Failed to grant MINTER role: ${minterError.message}`
            )
        }

        // Grant BURNER role with explicit gas settings
        log("Granting BURNER role to Registry...")
        try {
            const grantBurnerTx = await tokenContract.grantRole(
                burnerRole,
                registryContract.target,
                GAS_SETTINGS
            )
            await grantBurnerTx.wait()
            log("✅ BURNER role granted")
        } catch (burnerError) {
            throw new Error(
                `Failed to grant BURNER role: ${burnerError.message}`
            )
        }

        // Verification with error handling
        if (
            !developmentChains.includes(network.name) &&
            process.env.ETHERSCAN_API_KEY
        ) {
            log("\n7. Verifying contracts on Etherscan...")
            const verifyContract = async (address, args) => {
                try {
                    await verify(address, args)
                    log(`✅ ${address} verified`)
                } catch (verifyError) {
                    log(
                        `⚠️ Verification failed for ${address}: ${verifyError.message}`
                    )
                }
            }

            await verifyContract(medicalAccess.address, [])
            await verifyContract(prescriptionToken.address, [BASE_URI])
            await verifyContract(prescriptionRegistry.address, [
                medicalAccess.address,
                AddressZero,
                AddressZero,
            ])
        }

        log("\n🎉 Deployment completed successfully!")
        log("=========================================")
    } catch (error) {
        log("\n❌ Deployment failed!")
        log("Error details:", error.message)
        if (error.reason) log("Revert reason:", error.reason)
        if (error.transactionHash)
            log("Transaction hash:", error.transactionHash)
        process.exit(1)
    }
}

module.exports.tags = ["all", "deploy"]
