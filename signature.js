var Web3 = require('web3');

// replace the values below with your own values
var contractAddress = "0x9b1f7F645351AF3631a656421eD2e40f2802E6c0"; // USD-G contract
var sourceAddress = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
var sourcePrivateKey = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
var targetAddress = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0";
var amount = "10"; // sending 100 USD-G
var fee = "1"; // fee is 0.5 USD-G
var nonce = 1;

var web3 = new Web3(Web3.givenProvider);

var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
    { t: 'address', v: sourceAddress },
    { t: 'address', v: targetAddress },
    { t: 'uint256', v: amount },
    { t: 'uint256', v: fee },
    { t: 'uint256', v: nonce });

var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

// signature: 0x8fa899ec93a3f20b5294bed40ab33bac0913b0c9670a48795b99ff8f994526b95e6ff5d7e8ef2ab99c4b1edaf70569b549ba3747e7b4e43ade28405035777bfb1b
var signature = obj.signature;

console.log(signature);