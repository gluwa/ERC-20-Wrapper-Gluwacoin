var Web3 = require('web3');

var web3 = new Web3(Web3.givenProvider);

module.exports = {
    sign: function (contractAddress, sourceAddress, sourcePrivateKey, recipientAddress, amount, fee, nonce) {
        var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
            { t: 'address', v: sourceAddress },
            { t: 'address', v: recipientAddress },
            { t: 'uint256', v: amount },
            { t: 'uint256', v: fee },
            { t: 'uint256', v: nonce });

        var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

        var signature = obj.signature;

        return signature;
    },
    signMint: function (contractAddress, sourceAddress, sourcePrivateKey, amount, fee, nonce) {
        var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
            { t: 'address', v: sourceAddress },
            { t: 'uint256', v: amount },
            { t: 'uint256', v: fee },
            { t: 'uint256', v: nonce });

        var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

        var signature = obj.signature;

        return signature;
    },
    signBurn: function (contractAddress, sourceAddress, sourcePrivateKey, amount, fee, nonce) {
        var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
            { t: 'address', v: sourceAddress },
            { t: 'uint256', v: amount },
            { t: 'uint256', v: fee },
            { t: 'uint256', v: nonce });

        var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

        var signature = obj.signature;

        return signature;
    }
};