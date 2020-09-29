// Load dependencies
const { accounts, privateKeys, contract, web3 } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ControlledGluwacoin = contract.fromArtifact('ControlledGluwacoinMock');
const ERC20WrapperGluwacoin = contract.fromArtifact('ERC20WrapperGluwacoinMock');

var sign = require('./signature');

// Start test block
describe('ERC20WrapperGluwacoin', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'ERC20WrapperGluwacoin';
    const symbol = 'WG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    //const CONTROLLER_ROLE = web3.utils.soliditySha3('CONTROLLER_ROLE');
    const RELAYER_ROLE = web3.utils.soliditySha3('RELAYER_ROLE');

    beforeEach(async function () {
        // Deploy a new ControlledGluwacoin contract for each test
        this.baseToken = await ControlledGluwacoin.new('ControlledGluwacoin', 'CG', decimals, { from: deployer });
        // Deploy a new ERC20WrapperGluwacoin contract for each test
        this.token = await ERC20WrapperGluwacoin.new(name, symbol, decimals, this.baseToken.address, { from: deployer });
    });

    /* ERC20
    */
    it('token name is ' + name, async function () {
        expect(await this.token.name()).to.equal(name);
    });

    it('token symbol is ' + symbol, async function () {
        expect(await this.token.symbol()).to.equal(symbol);
    });

    it('token decimals are ' + decimals.toString(), async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal(decimals);
    });

    it('initial balance is 0', async function () {
        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');
    });

    it('initial totalSupply is 0', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
    });
});