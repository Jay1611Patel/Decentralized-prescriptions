const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("MedicalAccess", function () {
          let MedicalAccess
          let medicalAccess
          let admin, doctor, pharmacist, patient, unauthorized

          before(async () => {
              const signers = await ethers.getSigners()

              admin = signers[0]
              doctor = signers[1]
              pharmacist = signers[2]
              patient = signers[3]
              unauthorized = signers[4]

              MedicalAccess = await ethers.getContractFactory("MedicalAccess")
          })

          beforeEach(async () => {
              medicalAccess = await MedicalAccess.deploy()
              await medicalAccess.waitForDeployment()
          })

          describe("Role Management", () => {
              it("Should grant ADMIN_ROLE to deployer", async () => {
                  expect(
                      await medicalAccess.hasRole(
                          await medicalAccess.ADMIN_ROLE(),
                          admin.address
                      )
                  ).to.be.true
              })
              it("Should revert back when non-admin tries to access", async () => {
                  expect(
                      await medicalAccess.hasRole(
                          await medicalAccess.ADMIN_ROLE(),
                          unauthorized.address
                      )
                  ).to.be.reverted
              })
          })
          describe("Doctor Registration", () => {
              const licenseHash =
                  "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
              const doctorName = "Dr. Alice"
              const specialization = "Neurology"
              let expiryDate
              beforeEach(async () => {
                  expiryDate = (await time.latest()) + 86400 * 365
              })
              it("Should revert back when non-admin registers doctor", async () => {
                  await expect(
                      medicalAccess
                          .connect(unauthorized)
                          .registerDoctor(
                              doctor.address,
                              licenseHash,
                              expiryDate,
                              doctorName,
                              specialization
                          )
                  ).to.be.revertedWith("Caller is not an Admin")
              })
              it("Should register a new doctor", async () => {
                  await expect(
                      medicalAccess
                          .connect(admin)
                          .registerDoctor(
                              doctor.address,
                              licenseHash,
                              expiryDate,
                              doctorName,
                              specialization
                          )
                  ).to.emit(medicalAccess, "DoctorRegistered")
                  const doc = await medicalAccess.getDoctor(doctor.address)
                  assert.equal(doc.licenseHash, licenseHash)
                  expect(doc.isActive).to.be.true
                  const list = await medicalAccess.getAllDoctors()
              })
              it("Should revert with expired license", async () => {
                  expiryDate = (await time.latest()) - 86400
                  await expect(
                      medicalAccess
                          .connect(admin)
                          .registerDoctor(
                              doctor.address,
                              licenseHash,
                              expiryDate,
                              doctorName,
                              specialization
                          )
                  ).to.be.rejectedWith("License Expired")
              })
              it("Should prevent duplicate doctor registration", async () => {
                  medicalAccess
                      .connect(admin)
                      .registerDoctor(
                          doctor.address,
                          licenseHash,
                          expiryDate,
                          doctorName,
                          specialization
                      )
                  await expect(
                      medicalAccess.registerDoctor(
                          doctor.address,
                          "QmDifferentHash",
                          expiryDate + 86400,
                          "Dr. Bob",
                          "Pediatrics"
                      )
                  ).to.be.revertedWith("Doctor already registered")
              })

              it("Should return correct isActive status", async () => {
                  await medicalAccess.registerDoctor(
                      doctor.address,
                      licenseHash,
                      expiryDate,
                      doctorName,
                      specialization
                  )

                  await time.increase(86400 * 330)
                  expect(await medicalAccess.isActive(doctor.address)).to.be
                      .true

                  await time.increase(86400 * 35)
                  expect(await medicalAccess.isActive(doctor.address)).to.be
                      .false
              })
          })
          describe("Doctor revocation", () => {
              const licenseHash =
                  "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
              const doctorName = "Dr. Alice"
              const specialization = "Neurology"
              let expiryDate
              beforeEach(async () => {
                  expiryDate = (await time.latest()) + 86400 * 365
                  await medicalAccess.registerDoctor(
                      doctor.address,
                      licenseHash,
                      expiryDate,
                      doctorName,
                      specialization
                  )
              })
              it("Should revoke the doctor access", async () => {
                  await expect(
                      medicalAccess.revokeDoctor(doctor.address)
                  ).to.emit(medicalAccess, "DoctorRevoked")
                  expect(await medicalAccess.isActive(doctor.address)).to.be
                      .false
                  const doctorsList = await medicalAccess.getAllDoctors()
                  expect(doctorsList).to.not.include(doctor.address)
              })
              it("Should prevent revoking non-existent doctor", async () => {
                  await expect(
                      medicalAccess.revokeDoctor(pharmacist.address)
                  ).to.be.revertedWith("Not an active doctor")
              })
          })

          describe("Pharmacist management", () => {
              const pharmacyId = "PHARM123"
              const pharmacyName = "24/7 Pharmacy"
              it("Should register pharmacist", async () => {
                  await expect(
                      medicalAccess.registerPharmacist(
                          pharmacist.address,
                          pharmacyId,
                          pharmacyName
                      )
                  ).to.emit(medicalAccess, "PharmacistRegistered")
                  const pharm = await medicalAccess.getPharmacist(
                      pharmacist.address
                  )
                  assert.equal(pharm.pharmacyId, pharmacyId)
                  const list = await medicalAccess.getAllPharmacists()
                  assert(await medicalAccess.getPharmacistCount(), 1)
                  expect(list).to.include(pharmacist.address)
              })
              it("Should revoke Pharmacist", async () => {
                  await medicalAccess.registerPharmacist(
                      pharmacist.address,
                      pharmacyId,
                      pharmacyName
                  )
                  await expect(
                      medicalAccess.revokePharmacist(pharmacist.address)
                  ).to.emit(medicalAccess, "PharmacistRevoked")
                  const list = await medicalAccess.getAllDoctors()
                  expect(list).to.not.include(pharmacist.address)
                  expect(
                      await medicalAccess.isVerifiedPharmacist(
                          pharmacist.address
                      )
                  ).to.be.false
              })
          })
          describe("Patient Registration", () => {
              it("Should allow patient to self-register", async () => {
                  await expect(
                      medicalAccess.connect(patient).registerPatient()
                  ).to.emit(medicalAccess, "PatientRegistered")
                  expect(
                      await medicalAccess.hasRole(
                          await medicalAccess.PATIENT_ROLE(),
                          patient.address
                      )
                  ).to.be.true
              })
              it("Should prevent duplicate patient registration", async () => {
                  await medicalAccess.connect(patient).registerPatient()
                  await expect(
                      medicalAccess.connect(patient).registerPatient()
                  ).to.be.revertedWith("Patient already registered")
              })
          })
          describe("Emergency Feature", () => {
              it("Should toggle emergency pause", async () => {
                  await expect(medicalAccess.togglePause(72)).to.emit(
                      medicalAccess,
                      "PauseToggled"
                  )
                  expect(await medicalAccess.emergencyPause()).to.be.true
              })
              it("Should prevent action when paused", async () => {
                  await medicalAccess.togglePause(72)
                  await expect(
                      medicalAccess.registerDoctor(
                          doctor.address,
                          "QmHash",
                          (await time.latest()) + 86400,
                          "Dr. Paused",
                          "Oncology"
                      )
                  ).to.be.revertedWith("Contract paused")
              })
              it("Should auto-expire pause", async () => {
                  await medicalAccess.togglePause(1)
                  await time.increase(3601)
                  await expect(
                      medicalAccess.registerDoctor(
                          doctor.address,
                          "QmHash",
                          (await time.latest()) + 86400,
                          "Dr. Resumed",
                          "Pediatrics"
                      )
                  ).to.not.be.reverted
              })
          })
      })
