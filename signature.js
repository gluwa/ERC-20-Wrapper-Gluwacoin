var Web3 = require('web3');

// replace the values below with your own values
var contractAddress = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
var sourceAddress = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0";
var sourcePrivateKey = "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1";
var targetAddress = "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b";
var amount = "999";
var fee = "1";
var nonce = 1;

var web3 = new Web3(Web3.givenProvider);

var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
    { t: 'address', v: sourceAddress },
    { t: 'address', v: targetAddress },
    { t: 'uint256', v: amount },
    { t: 'uint256', v: fee },
    { t: 'uint256', v: nonce });

var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

var signature = obj.signature;

console.log(signature);