// migrations/2_deploy_Wrapper_Gluwacoin.js
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');

module.exports = async function (deployer) {
    const name = '[Base Token Symbol] Gluwacoin';
    const symbol = '[Base Token Symbol]-G';
    const decimals = 6;//Base Token Decimals
    const baseToken = '[Base Token Contract Address]';

    const instance = await deployProxy(
            ERC20WrapperGluwacoin,
            [name, symbol, decimals, baseToken],
            { from: deployer, unsafeAllowCustomTypes: true, initializer: 'initialize' }
    );

    console.log('Deployed', instance.address);
};