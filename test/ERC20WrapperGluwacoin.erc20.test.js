// Load dependencies
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN } = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const ERC20PresetMinterPauser = contract.fromArtifact('ERC20PresetMinterPauserMockUpgradeSafe');
const ERC20WrapperGluwacoin = contract.fromArtifact('ERC20WrapperGluwacoinMock');

// Start test block
describe('ERC20WrapperGluwacoin', function () {
    const [ deployer, other, another ] = accounts;

    const name = 'ERC20WrapperGluwacoin';
    const symbol = 'WG';
    const decimals = new BN('18');
   

    beforeEach(async function () {
        // Deploy a new ControlledGluwacoin contract for each test
        this.baseToken = await ERC20PresetMinterPauser.new('Gluwacoin', 'GC', { from: deployer });
        // Deploy a new ERC20WrapperGluwacoin contract for each test
        this.token = await ERC20WrapperGluwacoin.new(name, symbol, decimals, this.baseToken.address, { from: deployer });       
    });

    /* ERC20
    */
    describe('mint test', async function () {
        

        it('token name is ERC20WrapperGluwacoin', async function () {
            expect(await this.token.name()).to.equal(name);
        });

        it('token symbol is WG', async function () {
            expect(await this.token.symbol()).to.equal(symbol);
        });

        it('token decimals are 18', async function () {
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

    /* Gluwacoin
    */
    describe('mint test', async function () {
        it('token() returns baseToken address', async function () {
            expect(await this.token.token()).to.equal(this.baseToken.address);
        });
    });
});