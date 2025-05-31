const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("PrescriptionRegistry", function () {
          let PrescriptionRegistry,
              MedicalAccess,
              PrescriptionToken,
              PrescriptionFactory
          let registry, medicalAccess, token, factory
          let admin, doctor, pharmacist, patient, other

          before(async () => {
              const signers = await ethers.getSigners()
              admin = signers[0]
              doctor = signers[1]
              pharmacist = signers[2]
              patient = signers[3]
              other = signers[4]

              MedicalAccess = await ethers.getContractFactory("MedicalAccess")
              medicalAccess = await MedicalAccess.deploy()
              await medicalAccess.waitForDeployment()

              // Deploy PrescriptionToken
              PrescriptionToken = await ethers.getContractFactory(
                  "PrescriptionToken"
              )
              token = await PrescriptionToken.deploy("ipfs://test/")
              await token.waitForDeployment()

              // Deploy PrescriptionRegistry
              PrescriptionRegistry = await ethers.getContractFactory(
                  "PrescriptionRegistry"
              )
              registry = await PrescriptionRegistry.deploy(
                  medicalAccess.target,
                  doctor.address,
                  pharmacist.address
              )
              await registry.waitForDeployment()

              // Grant MINTER_ROLE and BURNER_ROLE to registry
              const MINTER_ROLE = await token.MINTER_ROLE()
              const BURNER_ROLE = await token.BURNER_ROLE()
              await token.grantRole(MINTER_ROLE, registry.target)
              await token.grantRole(BURNER_ROLE, registry.target)

              // Setup roles in MedicalAccess
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
              await registry.setPrescriptionToken(token.target)
          })
          beforeEach(async () => {
              snapshotId = await network.provider.send("evm_snapshot")
          })

          afterEach(async () => {
              await network.provider.send("evm_revert", [snapshotId])
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
                  await expect(tx)
                      .to.emit(registry, "PrescriptionCreated")
                      .to.emit(token, "Transfer")

                  const prescription = await registry.getPrescription(1)
                  assert.equal(prescription.doctor, doctor.address)
                  expect(prescription.isFulfilled).to.be.false
              })
              it("Should prevent non-doctors from creating", async () => {
                  await expect(
                      registry
                          .connect(other)
                          .createPrescription(
                              patient.address,
                              (await time.latest()) + 86400,
                              "QmPrescriptionHash"
                          )
                  ).to.be.reverted
              })
              it("Should reject expired prescriptions", async () => {
                  await expect(
                      registry
                          .connect(doctor)
                          .createPrescription(
                              patient.address,
                              (await time.latest()) - 1,
                              "QmPrescriptionHash"
                          )
                  ).to.be.revertedWith("Expiry date should be in future")
              })
              it("Should enforce patient registration", async () => {
                  await expect(
                      registry
                          .connect(doctor)
                          .createPrescription(
                              other.address,
                              (await time.latest()) + 86400,
                              "QmPrescriptionHash"
                          )
                  ).to.be.revertedWith("Patient not registered")
              })
          })
          describe("Prescription Expired", () => {
              let prescriptionId
              beforeEach(async () => {
                  await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 86400,
                          "QmFulfillHash"
                      )
                  prescriptionId = 1
              })
              it("Should block expired prescriptions", async () => {
                  const snapshotId = await network.provider.send("evm_snapshot")
                  await time.increase(86401) // 1 day + 1 second
                  await expect(
                      registry
                          .connect(pharmacist)
                          .fulfillPrescription(prescriptionId)
                  ).to.be.revertedWith("Prescription expired")
                  await network.provider.send("evm_revert", [snapshotId])
              })
          })
          describe("Prescription Fulfillment", () => {
              let prescriptionId
              beforeEach(async () => {
                  await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 86400,
                          "QmFulfillHash"
                      )
                  prescriptionId = 1
              })
              it("Should allow pharmacist fulfillment (with NFT burn)", async () => {
                  const tx = await registry
                      .connect(pharmacist)
                      .fulfillPrescription(prescriptionId)
                  await expect(tx)
                      .to.emit(registry, "PrescriptionFulfilled")
                      .to.emit(token, "Transfer")

                  const prescription = await registry.getPrescription(
                      prescriptionId
                  )
                  expect(prescription.isFulfilled).to.be.true
                  expect(prescription.fulfilledBy).to.equal(pharmacist.address)
              })

              it("Should reject unauthorized fulfillment", async () => {
                  await expect(
                      registry
                          .connect(other)
                          .fulfillPrescription(prescriptionId)
                  ).to.be.revertedWith("Not a verified Pharmacist")
              })

              it("Should avoid double fulfillment", async () => {
                  registry
                      .connect(pharmacist)
                      .fulfillPrescription(prescriptionId)
                  await expect(
                      registry
                          .connect(pharmacist)
                          .fulfillPrescription(prescriptionId)
                  ).to.be.rejectedWith("Prescription is fulfilled")
              })
          })
          describe("View functions", () => {
              beforeEach(async () => {
                  await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 86400,
                          "QmRx1"
                      )
                  await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 172800,
                          "QmRx2"
                      )
              })

              it("Should return prescription by ID", async () => {
                  const rx = await registry.getPrescription(2)
                  expect(rx.prescriptionHash).to.equal("QmRx2")
              })
              it("Should list patient prescriptions", async () => {
                  const rxIds = await registry.getPatientPrescriptions(
                      patient.address
                  )
                  expect(rxIds).to.have.lengthOf(2)
                  expect(rxIds).to.deep.equal([1, 2])
              })
              it("Should list doctor prescriptions", async () => {
                  const rxIds = await registry.getDoctorPrescriptions(
                      doctor.address
                  )
                  expect(rxIds).to.have.lengthOf(2)
              })
              it("Should return count of prescriptions", async () => {
                  const rxIds = await registry.getPrescriptionCount()
                  expect(rxIds).to.equal(2)
              })
              it("Should return empty array for no prescriptions", async () => {
                  const rxIds = await registry.getPatientPrescriptions(
                      other.address
                  )
                  expect(rxIds).to.have.lengthOf(0)
              })
          })
          describe("Token Integration", () => {
              it("Should mint NFT on creation", async () => {
                  await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 86400,
                          "QmTokenHash"
                      )
                  expect(await token.ownerOf(1)).to.equal(patient.address)
                  expect(await token.isPrescriptionToken(1)).to.be.true
              })
              it("Should burn NFT on fulfillment", async () => {
                  await registry
                      .connect(doctor)
                      .createPrescription(
                          patient.address,
                          (await time.latest()) + 86400,
                          "QmBurnHash"
                      )

                  await registry.connect(pharmacist).fulfillPrescription(1)
                  await expect(token.ownerOf(1)).to.be.reverted
              })
              it("Should allow admin to update token contract", async () => {
                  const newToken = await PrescriptionToken.deploy("ipfs://new/")
                  await registry
                      .connect(admin)
                      .setPrescriptionToken(newToken.target)
                  expect(await registry.prescriptionToken()).to.equal(
                      newToken.target
                  )
              })

              it("Should reject non-admin token updates", async () => {
                  await expect(
                      registry
                          .connect(doctor)
                          .setPrescriptionToken(other.address)
                  ).to.be.revertedWithCustomError(
                      registry,
                      "AccessControlUnauthorizedAccount"
                  )
              })
          })
      })
