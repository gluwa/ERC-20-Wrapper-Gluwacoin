// truffle-config.js
require('dotenv').config();

const HDWalletProvider = require('@truffle/hdwallet-provider');
const devInfuraProjectId = process.env.DEV_INFURA_PROJECT_ID;
const devMnemonic = process.env.DEV_MNEMONIC;
const prodInfuraProjectId = process.env.PROD_INFURA_PROJECT_ID;
const prodMnemonic = process.env.PROD_MNEMONIC;

module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
    rinkeby: {
      provider: () => new HDWalletProvider(devMnemonic, "https://rinkeby.infura.io/v3/" + devInfuraProjectId),
      network_id: 4,       // Rinkeby's id
      gas: 5500000,        // Rinkeby gas limit
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: false     // Skip dry run before migrations? (default: false for public nets )
    },
    mainnet: {
      provider: () => new HDWalletProvider(prodMnemonic, "https://rinkeby.infura.io/v3/" + prodInfuraProjectId),
      network_id: 4,       // Rinkeby's id
      gas: 5500000,        // Rinkeby gas limit
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: false     // Skip dry run before migrations? (default: false for public nets )
    },
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 5000
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "^0.6.0",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },
};