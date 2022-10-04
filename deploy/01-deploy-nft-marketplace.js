const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const args = []

    const nftMarketplace = await deploy("NftMarketplace", {
        // deploy contract
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.blockConfirmations || 1, // variable from config
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // if don't on development chains and have api etherscan - verify contract
        log("Verifying...")
        await verify(nftMarketplace.address, args) // from /utils/verify , function. Verifying.
    }

    log("------------------------------------")
}

module.exports.tags = ["all", "nftmarketplace"]
