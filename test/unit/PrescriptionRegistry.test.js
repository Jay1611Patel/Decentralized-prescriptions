const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("PrescriptionRegistry", function () {
          let PrescriptionRegistry, MedicalAccess, PrescriptionToken
          let registry, medicalAccess, token
          let owner, doctor, pharmacist, patient, other

          before(async () => {
              const signers = await ethers.getSigners()

              owner = signers[0]
              doctor = signers[1]
              pharmacist = signers[2]
              patient = signers[3]
              other = signers[4]

              MedicalAccess = await ethers.getContractFactory("MedicalAccess")
              medicalAccess = await MedicalAccess.deploy()

              PrescriptionToken = await ethers.getContractFactory(
                  "PrescriptionToken"
              )
              token = await PrescriptionToken.deploy("ipfs://baseURI/")

              PrescriptionRegistry = await ethers.getContractFactory(
                  "PrescriptionRegistry"
              )
              registry = await PrescriptionRegistry.deploy(
                  medicalAccess.address
              )
              await registry.waitForDeployment()

              await medicalAccess.registerDoctor(
                  doctor.address,
                  "QmDoctorLicense",
                  (await time.latest()) + 86400 * 365,
                  "Dr. Smith",
                  "Cardiology"
              )
              await medicalAccess.registerPharmacist(
                  pharmacist.address,
                  "PHARM001",
                  "Test Pharmacy"
              )
              await medicalAccess.connect(patient).registerPatient()
              await registry.setPrescriptionToken(token.address)
          })
          describe("Prescription Creation", () => {
              it("Should create prescription (with NFT mint)", async () => {
                  const tx = await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 86400,
                          "QmPrescriptionHash"
                      )
                  await expect(tx).to.emit(PrescriptionCreated)

                  const prescription = await registry.getPrescription(1)
                  assert.equal(prescription.doctor, doctor.address)
                  expect(prescription.isFulfilled).to.be.false
              })
          })
      })
