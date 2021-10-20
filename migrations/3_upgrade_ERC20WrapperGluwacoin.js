const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const New_ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');
//const ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');

module.exports = async function (deployer, network) {
  if (network == 'rinkeby') {
    const existing_address = "0x71B7E714f87D8b46711a2533c9783d73386B8287";

    const instance = await upgradeProxy(existing_address, New_ERC20WrapperGluwacoin, { deployer });
    //await New_ERC20WrapperGluwacoin.setNewRole(10000);
    console.info("adres " + instance.address);
    console.log('token ' + (await instance.token()));
  }
};