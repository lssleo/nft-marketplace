const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip // if we not on development chain - skip it
    : describe("Nft Markectplace tests", function () {
          let nftMarketplaceContract, nftMarketplace, basicNftContract, basicNft, deployer
          const PRICE = ethers.utils.parseEther("0.01")
          const TOKEN_ID = 0
          beforeEach(async function () {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = nftMarketplaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNft")
              basicNft = await basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID) // send NFT to marketplace
          })

          it("lists and can be bought", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              nftMarketplace = nftMarketplaceContract.connect(user)
              expect(
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
              ).to.emit("ItemBought")
              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
              assert(newOwner.toString() == user.address)
              assert(deployerProceeds.toString() == PRICE.toString())
          })

          it("list item and emit Item Listed", async function () {
              expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                  "ItemListed"
              )
          })
          it("list item only once", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const error = `AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith(error)
          })
          it("Only owners can list NFT's", async function () {
              nftMarketplace = nftMarketplaceContract.connect(user)
              //   await basicNft.approve(user.address, TOKEN_ID)
              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NotOwner")
          })
          it("needs approvals to list item", async function () {
              await basicNft.approve(accounts[2].address, TOKEN_ID)
              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NotApprovedForMarketplace")
          })
          it("updates listing", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
              assert.equal(listing.price.toString(), PRICE.toString())
              assert.equal(listing.seller.toString(), deployer.address)
          })
          it("reverts cancelling if it's not listed", async function () {
              const error = `NotListed("${basicNft.address}", ${TOKEN_ID})`
              await expect(
                  nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
              ).to.be.revertedWith(error)
          })
          it("not owner can't cancelling the listing", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              nftMarketplace = nftMarketplaceContract.connect(user)
              await expect(
                  nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
              ).to.be.revertedWith("NftMarketplace__NotOwner")
          })
          it("remove listing and emit event", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                  "ItemCanceled"
              )
              const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
              assert.equal(listing.price.toString(), "0")
              assert.equal(listing.seller.toString(), ethers.constants.AddressZero) // chack that address was removed
          })
          it("revert buy item if it's don't listed", async function () {
              await expect(nftMarketplace.buyItem(basicNft.address, TOKEN_ID)).to.be.revertedWith(
                  "NotListed"
              )
          })
          it("reverts if price not enough (not met)", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              await expect(nftMarketplace.buyItem(basicNft.address, TOKEN_ID)).to.be.revertedWith(
                  "PriceNotMet"
              )
          })
          it("transfers NFT's to buyer and updates proceeds of seller", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              nftMarketplace = nftMarketplace.connect(user)
              expect(
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
              ).to.emit("ItemBought")
              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
              assert.equal(newOwner.toString(), user.address)
              assert.equal(deployerProceeds.toString(), PRICE.toString())
          })
          it("to update listing must be owner and listed", async function () {
              await expect(
                  nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NotListed")
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              nftMarketplace = nftMarketplaceContract.connect(user)
              await expect(
                  nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NotOwner")
          })
          it("updates the price", async function () {
              const updatedPrice = ethers.utils.parseEther("0.2")
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              expect(
                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, updatedPrice)
              ).to.emit("ItemListed")
              const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
              assert(listing.price.toString() == updatedPrice.toString())
          })
          it("withdraw reverted if no proceeds", async function () {
              await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith("NoProceeds")
          })
          it("withdraws proceeds", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              nftMarketplace = nftMarketplaceContract.connect(user)
              await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
              nftMarketplace = nftMarketplaceContract.connect(deployer)

              const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
              const deployerBalanceBefore = await deployer.getBalance()
              const txResponse = await nftMarketplace.withdrawProceeds()
              const transactionReceipt = await txResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)
              const deployerBalanceAfter = await deployer.getBalance()

              assert(
                  deployerBalanceAfter.add(gasCost).toString() ==
                      deployerProceedsBefore.add(deployerBalanceBefore).toString()
              )
          })
      })
