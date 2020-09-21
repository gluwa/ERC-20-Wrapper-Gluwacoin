// Load dependencies
const { accounts, privateKeys, contract, web3 } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ControlledGluwacoin = contract.fromArtifact('ControlledGluwacoinMock');

var sign = require('./signature');

// Start test block
describe('ControlledGluwacoin', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

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
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');
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

    /* Reservable related
    */
    it('can reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        expect(await this.token.reservedBalanceOf(other)).to.be.bignumber.equal(amount.toString());
    });

    it('cannot reserve with outdated expiryBlockNum', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock;
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer }),
            'ERC20Reservable: invalid block expiry number'
        );
    });

    it('cannot reserve with zero address as the executor', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = ZERO_ADDRESS;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = amount.sub(fee);
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer }),
            'ERC20Reservable: cannot execute from zero address'
        );
    });

    it('cannot reserve if amount + fee > balance', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_fee = fee;
        var reserve_amount = amount.sub(reserve_fee).add(new BN('1'));
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer }),
            'ERC20Reservable: insufficient unreserved balance'
        );
    });

    it('cannot reserve if amount + fee + reserved > balance', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var send_amount2 = new BN('10');
        var send_amount = amount.sub(fee).sub(send_amount2);
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, send_amount, fee, nonce);

        await this.token.reserve(other, another, executor, send_amount, fee, nonce, expiryBlockNum, signature, { from: deployer });

        send_amount = send_amount2;

        signature = sign.sign(this.token.address, other, other_privateKey, another, send_amount, fee, nonce);

        await expectRevert(
            this.token.reserve(other, another, executor, send_amount, fee, nonce, expiryBlockNum, signature, { from: deployer }),
            'ERC20Reservable: insufficient unreserved balance'
        );
    });

    it('cannot reserve if not amount + fee > 0', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = new BN('0');
        var reserve_fee = new BN('0');
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer }),
            'ERC20Reservable: invalid reserve amount'
        );
    });

    it('getReservation works', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_fee = fee;
        var reserve_amount = amount.sub(reserve_fee);
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        var reserve = await this.token.getReservation(other, nonce);

        expect(reserve.amount).to.be.bignumber.equal(reserve_amount);
        expect(reserve.fee).to.be.bignumber.equal(reserve_fee);
        expect(reserve.recipient).to.equal(another);
        expect(reserve.executor).to.equal(executor);
        expect(reserve.expiryBlockNum).to.be.bignumber.equal(expiryBlockNum);
    });

    it('executor can execute', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await this.token.execute(other, nonce, { from: deployer });
    });

    it('sender can execute', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await this.token.execute(other, nonce, { from: other });
    });

    it('receiver cannot execute', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await expectRevert(
            this.token.execute(other, nonce, { from: another }),
            'ERC20Reservable: this address is not authorized to execute this reservation'
        );
    });

    it('cannot execute expired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await time.advanceBlockTo(expiryBlockNum.add(new BN('1')));

        await expectRevert(
            this.token.execute(other, nonce, { from: deployer }),
            'ERC20Reservable: reservation has expired and cannot be executed'
        );
    });

    it('cannot execute executed reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await this.token.execute(other, nonce, { from: deployer });

        await expectRevert(
            this.token.execute(other, nonce, { from: deployer }),
            'ERC20Reservable: invalid reservation status to execute'
        );
    });

    it('cannot execute reclaimed reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await this.token.reclaim(other, nonce, { from: deployer });

        await expectRevert(
            this.token.execute(other, nonce, { from: deployer }),
            'ERC20Reservable: invalid reservation status to execute'
        );
    });

    it('executor can reclaim unexpired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await this.token.reclaim(other, nonce, { from: deployer });
    });

    it('executor can reclaim expired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await time.advanceBlockTo(expiryBlockNum.add(new BN('1')));

        await this.token.reclaim(other, nonce, { from: deployer });
    });

    it('sender can reclaim expired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await time.advanceBlockTo(expiryBlockNum.add(new BN('1')));

        await this.token.reclaim(other, nonce, { from: other });
    });

    it('sender cannot reclaim unexpired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: other }),
            'ERC20Reservable: reservation has not expired or you are not the executor and cannot be reclaimed'
        );
    });

    it('receiver cannot reclaim unexpired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: another }),
            'ERC20Reservable: only the sender or the executor can reclaim the reservation back to the sender'
        );
    });

    it('receiver cannot reclaim expired reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        await time.advanceBlockTo(expiryBlockNum.add(new BN('1')));

        await expectRevert(
            this.token.reclaim(other, nonce, { from: another }),
            'ERC20Reservable: only the sender or the executor can reclaim the reservation back to the sender'
        );
    });

    it('reservedBalanceOf accurate after reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        expect(await this.token.reservedBalanceOf(other)).to.be.bignumber.equal('0');

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        expect(await this.token.reservedBalanceOf(other)).to.be.bignumber.equal(amount.toString());
    });

    it('unreservedBalanceOf accurate after reserve', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        expect(await this.token.unreservedBalanceOf(other)).to.be.bignumber.equal(await this.token.balanceOf(other));

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        expect(await this.token.unreservedBalanceOf(other)).to.be.bignumber.equal(amount.sub(await this.token.reservedBalanceOf(other)).toString());
    });

    it('reservedBalanceOf accurate after execute', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        expect(await this.token.reservedBalanceOf(other)).to.be.bignumber.equal('0');

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        expect(await this.token.reservedBalanceOf(other)).to.be.bignumber.equal(amount.toString());

        await this.token.execute(other, nonce, { from: deployer });

        expect(await this.token.reservedBalanceOf(other)).to.be.bignumber.equal('0');
    });

    it('unreservedBalanceOf accurate after execute', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);

        expect(await this.token.unreservedBalanceOf(other)).to.be.bignumber.equal(await this.token.balanceOf(other));

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });

        expect(await this.token.unreservedBalanceOf(other)).to.be.bignumber.equal(amount.sub(await this.token.reservedBalanceOf(other)).toString());

        await this.token.execute(other, nonce, { from: deployer });

        expect(await this.token.unreservedBalanceOf(other)).to.be.bignumber.equal('0');
    });

    /* ETHless related
    */
    it('deployer has the default relayer role', async function () {
        expect(await this.token.getRoleMemberCount(RELAYER_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(RELAYER_ROLE, 0)).to.equal(deployer);
    });

    it('relayer can send ETHless transfer', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, amount.sub(fee), fee, nonce);

        await this.token.ethlessTransfer(other, another, amount.sub(fee), fee, nonce, signature, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(amount.sub(fee));
    });

    it('cannot send ETHless transfer more than balance', async function () {
        await this.token.mint(amount, { from: deployer });
        await this.token.transfer(other, amount, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, amount, fee, nonce);

        await expectRevert(
            this.token.ethlessTransfer(other, another, amount, fee, nonce, signature, { from: deployer }),
            'ERC20Reservable: transfer amount exceeds unreserved balance'
        );
    });
});