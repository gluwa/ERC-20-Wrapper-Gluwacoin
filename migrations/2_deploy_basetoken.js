// migrations/2_deploy_LG.js
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC20PresetMinterPauser = artifacts.require('ERC20PresetMinterPauserUpgradeSafe');

module.exports = async function (deployer) {
    const name = 'BaseToken';
    const symbol = 'BT';

    const instance = await deployProxy(
            ERC20PresetMinterPauser,
            [name, symbol],
            { from: deployer, unsafeAllowCustomTypes: true, initializer: 'initialize' }
        );
    // 0x88927744da1bc72AA721601A1f8Af83F5794EC52
    console.log('Deployed', instance.address);
};