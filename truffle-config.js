// truffle-config.js
require('dotenv').config();

const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraProjectId = process.env.INFURA_PROJECT_ID;
const mnemonic = process.env.DEV_MNEMONIC;

module.exports = {
  networks: {
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/" + infuraProjectId),
      network_id: 4,       // Rinkeby's id
      gas: 5500000,        // Rinkeby gas limit
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
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