const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("PrescriptionToken", function () {
          let PrescriptionToken, token
          let admin, registry, patient, other
          before(async () => {
              ;[admin, registry, patient, other] = await ethers.getSigners()

              PrescriptionToken = await ethers.getContractFactory(
                  "PrescriptionToken"
              )
              token = await PrescriptionToken.deploy("ipfs://base/")
              await token.waitForDeployment()
          })
          beforeEach(async () => {
              snapshotId = await network.provider.send("evm_snapshot")
          })

          afterEach(async () => {
              await network.provider.send("evm_revert", [snapshotId])
          })
          describe("Deployment", () => {
              it("Should grant admin roles to deployer", async () => {
                  const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE()
                  const MINTER_ROLE = await token.MINTER_ROLE()
                  const BURNER_ROLE = await token.BURNER_ROLE()

                  expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
                      .to.be.true
                  expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be
                      .true
                  expect(await token.hasRole(BURNER_ROLE, admin.address)).to.be
                      .true
              })
          })
          describe("Minting", () => {
              it("Should mint tokens with MINTER_ROLE", async () => {
                  const MINTER_ROLE = await token.MINTER_ROLE()
                  await token.grantRole(MINTER_ROLE, registry.address)

                  await expect(
                      token
                          .connect(registry)
                          .mint(patient.address, 1, "meta1.json")
                  )
                      .to.emit(token, "Transfer")
                      .withArgs(ethers.ZeroAddress, patient.address, 1)

                  expect(await token.ownerOf(1)).to.equal(patient.address)
              })
              it("Should reject minting without MINTER_ROLE", async () => {
                  await expect(
                      token
                          .connect(other)
                          .mint(patient.address, 2, "invalid.json")
                  ).to.be.revertedWithCustomError(
                      token,
                      "AccessControlUnauthorizedAccount"
                  )
              })
              it("Should prevent duplicate token IDs", async () => {
                  const MINTER_ROLE = await token.MINTER_ROLE()
                  await token.grantRole(MINTER_ROLE, registry.address)
                  // 1. First mint (success)
                  await token
                      .connect(registry)
                      .mint(patient.address, 3, "meta1.json")

                  // 2. Verify first mint succeeded
                  expect(await token.ownerOf(3)).to.equal(patient.address)

                  // 3. Attempt duplicate mint with same ID
                  await expect(
                      token
                          .connect(registry)
                          .mint(other.address, 3, "meta2.json")
                  ).to.be.reverted
              })
          })
          describe("Burning", () => {
              beforeEach(async () => {
                  const MINTER_ROLE = await token.MINTER_ROLE()
                  await token.grantRole(MINTER_ROLE, registry.address)
                  const BURNER_ROLE = await token.BURNER_ROLE()
                  await token.grantRole(BURNER_ROLE, registry.address)
              })
              it("Should burn tokens with BURNER_ROLE", async () => {
                  // 1. First mint the token
                  await token
                      .connect(registry)
                      .mint(patient.address, 4, "burnable.json")

                  // 2. Verify initial ownership
                  expect(await token.ownerOf(4)).to.equal(patient.address)

                  // 3. Burn and verify
                  await expect(token.connect(registry).burn(4))
                      .to.emit(token, "Transfer")
                      .withArgs(patient.address, ethers.ZeroAddress, 4) // Note: Burning transfers TO zero address

                  // 4. Verify token no longer exists
                  await expect(token.ownerOf(4)).to.be.reverted
              })
              it("Should reject burning without BURNER_ROLE", async () => {
                  await expect(
                      token.connect(other).burn(4)
                  ).to.be.revertedWithCustomError(
                      token,
                      "AccessControlUnauthorizedAccount"
                  )
              })
          })
          describe("Token URI", () => {
              beforeEach(async () => {
                  const MINTER_ROLE = await token.MINTER_ROLE()
                  await token.grantRole(MINTER_ROLE, registry.address)
                  const BURNER_ROLE = await token.BURNER_ROLE()
                  await token.grantRole(BURNER_ROLE, registry.address)
              })
              it("Should return correct token URI", async () => {
                  await token
                      .connect(registry)
                      .mint(patient.address, 5, "custom.json")
                  expect(await token.tokenURI(5)).to.equal(
                      "ipfs://base/custom.json"
                  )
              })
              it("Should update base URI", async () => {
                  await token
                      .connect(registry)
                      .mint(patient.address, 5, "custom.json")
                  await token.setBaseURI("ipfs://new-base/")
                  assert.equal(await token.getBaseURI(), "ipfs://new-base/")
                  expect(await token.tokenURI(5)).to.equal(
                      "ipfs://new-base/custom.json"
                  )
              })
              it("Should reject base URI updates from non-admins", async () => {
                  await expect(
                      token.connect(other).setBaseURI("hacked/")
                  ).to.be.revertedWithCustomError(
                      token,
                      "AccessControlUnauthorizedAccount"
                  )
              })
          })
          describe("Transfers", () => {
              beforeEach(async () => {
                  const MINTER_ROLE = await token.MINTER_ROLE()
                  await token.grantRole(MINTER_ROLE, registry.address)
                  const BURNER_ROLE = await token.BURNER_ROLE()
                  await token.grantRole(BURNER_ROLE, registry.address)
                  await token
                      .connect(registry)
                      .mint(patient.address, 6, "transfer.json")
              })
              it("Should prevent standard transfers", async () => {
                  await expect(
                      token
                          .connect(other)
                          .transferFrom(patient.address, other.address, 6)
                  ).to.be.reverted
              })
              it("Should allow burning as transfer to zero", async () => {
                  await token.connect(registry).burn(6)
                  expect(await token.balanceOf(patient.address)).to.equal(0)
              })
          })
      })
