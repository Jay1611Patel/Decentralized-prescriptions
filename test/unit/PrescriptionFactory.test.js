const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("PrescriptionFactory", function () {
          let PrescriptionFactory, factory
          let admin, doctor, pharmacist, patient

          before(async () => {
              ;[admin, doctor, pharmacist, patient] = await ethers.getSigners()
              PrescriptionFactory = await ethers.getContractFactory(
                  "PrescriptionFactory"
              )
          })
          beforeEach(async () => {
              snapshotId = await network.provider.send("evm_snapshot")
          })

          afterEach(async () => {
              await network.provider.send("evm_revert", [snapshotId])
          })
          describe("Deployment", () => {
              it("Should deploy all contracts with correct relationships", async () => {
                  factory = await PrescriptionFactory.connect(admin).deploy(
                      "ipfs://baseURI/"
                  )
                  await factory.waitForDeployment()

                  const medicalAccess = await ethers.getContractAt(
                      "MedicalAccess",
                      await factory.medicalAccess()
                  )
                  const registry = await ethers.getContractAt(
                      "PrescriptionRegistry",
                      await factory.prescriptionRegistry()
                  )
                  const token = await ethers.getContractAt(
                      "PrescriptionToken",
                      await factory.prescriptionToken()
                  )
                  expect(await registry.medicalAccess()).to.equal(
                      medicalAccess.address
                  )
                  expect(await registry.prescriptionToken()).to.equal(
                      token.address
                  )
              })
          })
      })
