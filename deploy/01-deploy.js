const { ethers, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()
const fs = require("fs")
const path = require("path")

// Configurable settings
const DEPLOYMENT_SETTINGS = {
    gasLimit: 6_000_000,
    gasPrice: ethers.parseUnits("10", "gwei"),
    waitConfirmations: network.config.blockConfirmations || 1,
    contractArtifactsPath: "../frontend/src/contracts",
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const isLocalNetwork = developmentChains.includes(network.name)

    log("\n============ Starting Deployment ============")
    log(`Network: ${network.name} (ChainID: ${chainId})`)
    log(`Deployer: ${deployer}`)
    log(
        `Using gas price: ${ethers.formatUnits(
            DEPLOYMENT_SETTINGS.gasPrice,
            "gwei"
        )} gwei`
    )

    try {
        // ========== 1. Library Deployment ==========
        log("\n1. Deploying libraries...")

        const permissionsLib = await deploy("PermissionsLib", {
            from: deployer,
            log: true,
            waitConfirmations: DEPLOYMENT_SETTINGS.waitConfirmations,
            ...DEPLOYMENT_SETTINGS,
        })

        const registryLib = await deploy("RegistryLib", {
            from: deployer,
            log: true,
            waitConfirmations: DEPLOYMENT_SETTINGS.waitConfirmations,
            ...DEPLOYMENT_SETTINGS,
        })

        log(`✅ Libraries deployed:
        - PermissionsLib: ${permissionsLib.address}
        - RegistryLib: ${registryLib.address}`)

        // ========== 2. Main Contract Deployment ==========
        log("\n2. Deploying MedicalAccess with linked libraries...")

        const medicalAccess = await deploy("MedicalAccess", {
            from: deployer,
            log: true,
            waitConfirmations: DEPLOYMENT_SETTINGS.waitConfirmations,
            libraries: {
                PermissionsLib: permissionsLib.address,
                RegistryLib: registryLib.address,
            },
            ...DEPLOYMENT_SETTINGS,
        })

        if (!medicalAccess.address) {
            throw new Error(
                "MedicalAccess deployment failed - no address returned"
            )
        }
        log(`✅ MedicalAccess deployed to: ${medicalAccess.address}`)

        // ========== 3. Save Artifacts ==========
        log("\n3. Saving deployment artifacts...")

        const contractsDir = path.join(
            __dirname,
            DEPLOYMENT_SETTINGS.contractArtifactsPath
        )
        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir, { recursive: true })
        }

        // Save all artifacts in parallel
        await saveArtifact("MedicalAccess", medicalAccess.address, {
            libraries: {
                PermissionsLib: permissionsLib.address,
                RegistryLib: registryLib.address,
            },
        })
        await saveArtifact("PermissionsLib", permissionsLib.address)
        await saveArtifact("RegistryLib", registryLib.address)

        // ========== 4. System Contracts Deployment ==========
        log("\n4. Deploying system contracts...")

        const BASE_URI = process.env.IPFS_URI || "ipfs://default-uri/"
        const AddressZero = ethers.ZeroAddress

        const prescriptionToken = await deploy("PrescriptionToken", {
            from: deployer,
            args: [BASE_URI],
            waitConfirmations: network.config.blockConfirmations || 1,
            ...DEPLOYMENT_SETTINGS,
        })

        const prescriptionRegistry = await deploy("PrescriptionRegistry", {
            from: deployer,
            args: [medicalAccess.address],
            waitConfirmations: network.config.blockConfirmations || 1,
            ...DEPLOYMENT_SETTINGS,
        })

        log(`✅ System contracts deployed:
        - PrescriptionToken: ${prescriptionToken.address}
        - PrescriptionRegistry: ${prescriptionRegistry.address}`)

        // Save remaining artifacts
        await Promise.all([
            saveArtifact("PrescriptionToken", prescriptionToken.address),
            saveArtifact("PrescriptionRegistry", prescriptionRegistry.address),
        ])

        // ========== 5. System Configuration ==========
        log("\n5. Configuring system roles...")

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

        // Batch role configuration
        const configureRoles = async () => {
            const [minterRole, burnerRole] = await Promise.all([
                tokenContract.MINTER_ROLE(),
                tokenContract.BURNER_ROLE(),
            ])

            await Promise.all([
                tokenContract.grantRole(
                    minterRole,
                    registryContract.target,
                    DEPLOYMENT_SETTINGS
                ),
                tokenContract.grantRole(
                    burnerRole,
                    registryContract.target,
                    DEPLOYMENT_SETTINGS
                ),
            ])
        }

        await configureRoles()
        log("✅ System roles configured successfully")

        // ========== 6. Verification ==========
        if (!isLocalNetwork && process.env.ETHERSCAN_API_KEY) {
            log("\n6. Verifying contracts...")

            await verifyContracts([
                {
                    name: "PermissionsLib",
                    address: permissionsLib.address,
                    args: [],
                },
                { name: "RegistryLib", address: registryLib.address, args: [] },
                {
                    name: "MedicalAccess",
                    address: medicalAccess.address,
                    args: [],
                },
                {
                    name: "PrescriptionToken",
                    address: prescriptionToken.address,
                    args: [BASE_URI],
                },
                {
                    name: "PrescriptionRegistry",
                    address: prescriptionRegistry.address,
                    args: [medicalAccess.address, AddressZero, AddressZero],
                },
            ])
        }

        log("\n🎉 Deployment completed successfully!")
        log("=========================================")
    } catch (error) {
        handleDeploymentError(error, chainId, network.name)
    }
}

// ========== Helper Functions ==========
async function saveArtifact(contractName, address, extraData = {}) {
    const contractsDir = path.join(__dirname, "../frontend/src/abi")
    const artifact = await deployments.getArtifact(contractName)

    fs.writeFileSync(
        path.join(contractsDir, `${contractName}.json`),
        JSON.stringify(
            {
                contractName,
                address,
                abi: artifact.abi,
                ...extraData,
            },
            null,
            2
        )
    )
}

async function verifyContracts(contracts) {
    for (const contract of contracts) {
        try {
            await verify(contract.address, contract.args)
            log(`✅ ${contract.name} verified at ${contract.address}`)
        } catch (error) {
            log(`⚠️ Failed to verify ${contract.name}: ${error.message}`)
        }
    }
}

function handleDeploymentError(error, chainId, networkName) {
    console.error("\n❌ Deployment failed!")
    console.error("Error:", error.message)

    if (error.reason) console.error("Revert reason:", error.reason)
    if (error.transactionHash) {
        console.error("Transaction hash:", error.transactionHash)
        if (chainId !== 31337) {
            console.error(
                `View on Etherscan: https://${networkName}.etherscan.io/tx/${error.transactionHash}`
            )
        }
    }

    process.exit(1)
}

module.exports.tags = ["all", "deploy"]
