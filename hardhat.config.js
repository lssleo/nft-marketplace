require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
// const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL

// const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY
// const POLYGON_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
// const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY
const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // If you want to do some forking set `enabled` to true
            // forking: {
            //     url: MAINNET_RPC_URL,
            //     blockNumber: FORKING_BLOCK_NUMBER,
            //     enabled: false,
            // },
            chainId: 31337,
        },
        localhost: {
            chainId: 31337,
        },

        // mainnet: {
        //     url: MAINNET_RPC_URL,
        //     accounts: [MAINNET_PRIVATE_KEY],
        //     saveDeployments: true,
        //     chainId: 1,
        // },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [GOERLI_PRIVATE_KEY],
            saveDeployments: true,
            blockConfirmations: 6,
            chainId: 5,
        },
        // polygon: {
        //     url: POLYGON_MAINNET_RPC_URL,
        //     accounts: [POLYGON_PRIVATE_KEY],
        //     saveDeployments: true,
        //     chainId: 137,
        // },
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            // mainnet: ETHERSCAN_API_KEY,
            goerli: ETHERSCAN_API_KEY,
            // polygon: POLYGONSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    contractSizer: {
        runOnCompile: false,
        only: ["APIConsumer", "KeepersCounter", "PriceConsumerV3", "RandomNumberConsumerV2"],
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        feeCollector: {
            default: 1,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.4.24",
            },
        ],
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
}
