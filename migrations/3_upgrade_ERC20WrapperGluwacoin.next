const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const New_ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');
const ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');

module.exports = async function (deployer) {  
  const  existing_address = (await ERC20WrapperGluwacoin.deployed()).address;
  await upgradeProxy(existing_address, New_ERC20WrapperGluwacoin, { deployer });
};