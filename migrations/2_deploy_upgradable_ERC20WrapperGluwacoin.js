const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');


module.exports = async function (deployer, network) {
    const name = 'USDC Gluwacoin';
    const symbol = 'USDC-G';
    const decimals = 6;
<<<<<<< HEAD
    const rinkeby_baseTokenAddress = '0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b';
    

    if (network == 'local') {
        // Deploy a mock USD Coin for non-production networks
        const ERC20TestToken = artifacts.require("ERC20TestToken");
        deployer.then(function() {
            return ERC20TestToken.new('USDC-1', 'USDC-1', decimals);
        }).then(function(baseToken) {
            const baseTokenAddress = baseToken.address;

            console.log('basetoken ', baseTokenAddress);

            return deployProxy(
                ERC20WrapperGluwacoin,
                [name, symbol, baseTokenAddress],
                {deployer, initializer: 'initialize' }
            );
        }).then(function(instance) {
            console.log('Deployed', instance.address);
        });
    } else if (network == "rinkeby") {
        // use USD Coin contract address in remote network

        console.log('basetoken ', rinkeby_baseTokenAddress);

        const instance = await deployProxy(
                ERC20WrapperGluwacoin,
                [name, symbol, rinkeby_baseTokenAddress],
                {deployer, initializer: 'initialize' }
        );        

        console.log('Deployed', instance.address);
        console.log('token ' + (await instance.token()));       

=======
    var baseTokenAddress;
    var admin;
    var skip = false;

    switch (network) {
        case "rinkeby":
            {
                baseTokenAddress = '0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b';
                admin = "0xfd91d059f0d0d5f6adee0f4aa1fdf31da2557bc9";
                break;
            }

        case "mainnet":
            {
                baseTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
                admin = "0x8cDFCaAD5df8A24f983882BaF461F33e1bC24000";
                break;
            }

        default: {
            skip = true;
            break;
        }
    }

    if (!skip) {
        const instance = await deployProxy(
            ERC20WrapperGluwacoin,
            [name, symbol, decimals, admin, baseTokenAddress],
            { deployer, initializer: 'initialize' }
        );

        console.log('Deployed ', instance.address);
        console.log('token ' + (await instance.token()));
>>>>>>> master
    }
};