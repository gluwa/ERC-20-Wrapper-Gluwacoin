// Load dependencies
const { expect } = require('chai');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

// Load compiled artifacts
const ERC20PresetMinterPauser = artifacts.require('ERC20PresetMinterPauserMockUpgradeSafe');
const ERC20WrapperGluwacoin = artifacts.require('ERC20WrapperGluwacoin');

// Start test block
contract('ERC20WrapperGluwacoin', function ([_, deployer]) {
    const name = 'ERC20WrapperGluwacoin';
    const symbol = 'WG';
    const decimals = 6;

    beforeEach(async function () {
        // Deploy a new ERC20 contract for each test
        this.baseToken = await ERC20PresetMinterPauser.new('ERC20', 'E2', { from: deployer });
        // Deploy a new ERC20WrapperGluwacoin contract for each test
        this.token = await deployProxy(
                ERC20WrapperGluwacoin,
                [name, symbol, decimals, this.baseToken.address],
                { from: deployer, unsafeAllowCustomTypes: true, initializer: 'initialize' }
            );
    });

    it('retrieve returns a value previously initialized', async function () {
        expect(await this.token.name()).to.equal(name);
        expect(await this.token.symbol()).to.equal(symbol);
        expect((await this.token.decimals()).toString()).to.equal(decimals.toString());
        expect(await this.token.token()).to.equal(this.baseToken.address);
    });

    it('retrieve returns a value previously initialized after an upgrade', async function () {
        const newToken = await upgradeProxy(
            this.token.address, ERC20WrapperGluwacoin, { from: deployer, unsafeAllowCustomTypes: true });

        expect(await newToken.name()).to.equal(name);
        expect(await newToken.symbol()).to.equal(symbol);
        expect((await newToken.decimals()).toString()).to.equal(decimals.toString());
        expect(await newToken.token()).to.equal(this.baseToken.address);
    });
});