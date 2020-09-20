// Load dependencies
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ControlledGluwacoin = contract.fromArtifact('ControlledGluwacoinMock');

// Start test block
describe('ControlledGluwacoin', function () {
    const deployer = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';
    const deployer_privateKey = '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1';
    const [ other, another ] = accounts;

    const name = 'ControlledGluwacoin';
    const symbol = 'CG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const CONTROLLER_ROLE = web3.utils.soliditySha3('CONTROLLER_ROLE');
    const RELAYER_ROLE = web3.utils.soliditySha3('RELAYER_ROLE');


    beforeEach(async function () {
        // Deploy a new ControlledGluwacoin contract for each test
        this.token = await ControlledGluwacoin.new(name, symbol, decimals, { from: deployer });
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
    });

    it('initial totalSupply is 0', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
    });

    /* Controllable related
    */
    it('deployer has the default controller role', async function () {
        expect(await this.token.getRoleMemberCount(CONTROLLER_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(CONTROLLER_ROLE, 0)).to.equal(deployer);
    });

    it('controller can mint', async function () {
        await this.token.mint(amount, { from: deployer });
    });

    it('controller can mint MAX_UINT256', async function () {
        await this.token.mint(MAX_UINT256, { from: deployer });
    });

    it('controller can mint 0', async function () {
        await this.token.mint(0, { from: deployer });
    });

    it('non-controller cannot mint', async function () {
        await expectRevert(
            this.token.mint(amount, { from: other }),
            'ERC20Controllable: only controllers can call this method'
        );
    });

    it('mint emits a Mint event', async function () {
        const receipt = await this.token.mint(amount, { from: deployer });

        expectEvent(receipt, 'Mint', { _mintTo: deployer, _value: amount });
    });

    it('mint emits a Transfer event', async function () {
        const receipt = await this.token.mint(amount, { from: deployer });

        expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: deployer, value: amount });
    });

    it('mint increases the totalSupply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
        await this.token.mint(amount, { from: deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(amount);
    });

    it('controller can burn', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.burn(amount, { from: deployer });
    });

    it('non-controller cannot burn', async function () {
        await this.token.mint(amount, { from: deployer });
        await expectRevert(
            this.token.burn(amount, { from: other }),
            'ERC20Controllable: only controllers can call this method'
        );
    });

    it('burn emits a Burnt event', async function () {
        await this.token.mint(amount, { from: deployer });
        const receipt = await this.token.burn(amount, { from: deployer });

        expectEvent(receipt, 'Burnt', { _burnFrom: deployer, _value: amount });
    });

    it('burn emits a Transfer event', async function () {
        await this.token.mint(amount, { from: deployer });
        const receipt = await this.token.burn(amount, { from: deployer });

        expectEvent(receipt, 'Transfer', { from: deployer, to: ZERO_ADDRESS, value: amount });
    });

    it('burn decreases the totalSupply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
        await this.token.mint(amount, { from: deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(amount);
        await this.token.burn(amount, { from: deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
    });

    /* ETHless related
    */
    it('deployer has the default relayer role', async function () {
        expect(await this.token.getRoleMemberCount(RELAYER_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(RELAYER_ROLE, 0)).to.equal(deployer);
    });

    it('deployer can relay ETHless transfer', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        const nonce = '1'

        var hash = web3.utils.soliditySha3({ t: 'address', v: this.token },
            { t: 'address', v: other },
            { t: 'address', v: another },
            { t: 'uint256', v: amount - fee },
            { t: 'uint256', v: fee },
            { t: 'uint256', v: nonce });

        var obj = web3.eth.accounts.sign(hash , deployer_privateKey);

        var signature = obj.signature;

        await this.token.ethlessTransfer(other, another, amount - fee, amount, nonce, signature)
    });
});