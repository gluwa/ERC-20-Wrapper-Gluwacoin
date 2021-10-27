<<<<<<< HEAD
=======
//IMPORTANT: THIS FILE IS FOR TESTNET ONLY
//SKIP THIS FILE IF DEPLOY ON MAINNET

>>>>>>> master
const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const New_ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');
//const ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');

<<<<<<< HEAD
module.exports = async function (deployer, network) {  
  const existing_address = "0x71B7E714f87D8b46711a2533c9783d73386B8287";

  const instance = await upgradeProxy(existing_address, New_ERC20WrapperGluwacoin, { deployer });
  //await New_ERC20WrapperGluwacoin.setNewRole(10000);
  console.info("adres " + instance.address);
  console.log('token ' + (await instance.token()));       


  //console.info(await New_ERC20WrapperGluwacoin.newRole);
=======

module.exports = async function (deployer, network) {
  if (network == 'rinkeby') {
    const existing_address = "0x0aD1439A0e0bFdcD49939f9722866651a4AA9B3C";

    const instance = await upgradeProxy(existing_address, New_ERC20WrapperGluwacoin, { deployer, unsafeAllowCustomTypes: true });
    
    console.info("adres " + instance.address);
    console.log('token ' + (await instance.token()));
    console.log('token ' + (await instance.setValS()));
    console.log('token ' + (await instance._newDecimals1));
  }
>>>>>>> master
};