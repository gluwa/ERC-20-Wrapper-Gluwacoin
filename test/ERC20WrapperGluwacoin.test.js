// Load dependencies
const { accounts, privateKeys, contract, web3 } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ERC20PresetMinterPauser = contract.fromArtifact('ERC20PresetMinterPauserMockUpgradeSafe');
const ERC20WrapperGluwacoin = contract.fromArtifact('ERC20WrapperGluwacoinMock');

var sign = require('./signature');

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

    it('token() returns baseToken address', async function () {
        expect(await this.token.token()).to.equal(this.baseToken.address);
    });
});

describe('ERC20WrapperGluwacoin_Wrapper', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'ERC20WrapperGluwacoin';
    const symbol = 'WG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const WRAPPER_ROLE = web3.utils.soliditySha3('WRAPPER_ROLE');
    const RELAYER_ROLE = web3.utils.soliditySha3('RELAYER_ROLE');

    beforeEach(async function () {
        // Deploy a new ControlledGluwacoin contract for each test
        this.baseToken = await ERC20PresetMinterPauser.new('Gluwacoin', 'GC', { from: deployer });
        // Deploy a new ERC20WrapperGluwacoin contract for each test
        this.token = await ERC20WrapperGluwacoin.new(name, symbol, decimals, this.baseToken.address, { from: deployer });
    });

    /* Wrapper related
    */
    describe('mint test', async function () {
        it('other can mint', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);
        });
    
        it('other can mint MAX_UINT256', async function () {
            var baseToken_amount = MAX_UINT256;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);
        });
    
        it('other can mint 0', async function () {
            var mint_amount = new BN('0');

            await this.token.mint(mint_amount, { from: other });

            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);
        });
    
        it('other can mint less than allowance', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount.sub(new BN('1'));

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);
        });
    
        it('other cannot mint more than allowance', async function () {
            var baseToken_amount = MAX_UINT256;
            var allowance_amount = amount;
            var mint_amount = allowance_amount.add(new BN('1'));

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await expectRevert(
                this.token.mint(mint_amount, { from: other }),
                'ERC20: transfer amount exceeds allowance'
            );
        });
    
        it('mint increases the totalSupply', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });
    
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);
        });

        it('mint emits a Mint event', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });

            const receipt = await this.token.mint(mint_amount, { from: other });

            expectEvent(receipt, 'Mint', { _mintTo: other, _value: mint_amount });
        });

        it('mint emits a Transfer event', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });

            const receipt = await this.token.mint(mint_amount, { from: other });

            expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: other, value: mint_amount });
        });
    });

    describe('burn test', async function () {
        it('other can burn', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);
    
            await this.token.burn(burn_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount).add(burn_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount.sub(burn_amount));
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount.sub(burn_amount));
        });

        it('other can burn MAX_UINT256', async function () {
            var baseToken_amount = MAX_UINT256;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);

            await this.token.burn(burn_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount).add(burn_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount.sub(burn_amount));
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount.sub(burn_amount));
        });

        it('other can burn 0', async function () {
            await this.token.burn(0, { from: other });
        });

        it('other can burn less than its balance', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount.sub(new BN('1'));

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);

            await this.token.burn(burn_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount).add(burn_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount.sub(burn_amount));
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount.sub(burn_amount));
        });

        it('other cannot burn more than its balance', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount.add(new BN('1'));

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(baseToken_amount.sub(mint_amount));
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mint_amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount);

            await expectRevert(
                this.token.burn(burn_amount, { from: other }),
                'ERC20: transfer amount exceeds balance'
            );
        });
    
        it('burn decreases the totalSupply', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });
            await this.token.burn(burn_amount, { from: other });

            expect(await this.token.totalSupply()).to.be.bignumber.equal(mint_amount.sub(burn_amount));
        });

        it('burn emits a Burnt event', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });

            const receipt = await this.token.burn(burn_amount, { from: other });

            expectEvent(receipt, 'Burnt', { _burnFrom: other, _value: burn_amount });
        });

        it('burn emits a Transfer event', async function () {
            var baseToken_amount = amount;
            var allowance_amount = baseToken_amount;
            var mint_amount = allowance_amount;
            var burn_amount = mint_amount;

            await this.baseToken.mint(other, baseToken_amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, allowance_amount, { from: other });
            await this.token.mint(mint_amount, { from: other });

            const receipt = await this.token.burn(burn_amount, { from: other });

            expectEvent(receipt, 'Transfer', { from: other, to: ZERO_ADDRESS, value: burn_amount });
        });
    });

    describe('wrapper test', async function () {
        const total = amount.add(fee);

        it('deployer has the default wrapper role', async function () {
            expect(await this.token.getRoleMemberCount(WRAPPER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(WRAPPER_ROLE, 0)).to.equal(deployer);
        });
    
        it('wrapper can mint ETHlessly', async function () {  
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, this.token.address, amount, fee, nonce);
            await this.token.methods['mint(address,uint256,uint256,uint256,bytes)'](other, amount, fee, nonce, signature, { from: deployer });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.sub(fee));
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
        });

        it('ETHless mint emits a Mint event', async function () {
            await this.baseToken.mint(other, total, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, total, { from: other });
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, this.token.address, amount, fee, nonce);
            var receipt = await this.token.methods['mint(address,uint256,uint256,uint256,bytes)'](other, amount, fee, nonce, signature, { from: deployer });

            expectEvent(receipt, 'Mint', {_mintTo: other, _value: amount });
        });
    
        it('another can mint ETHlessly but wrapper gets the fee', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, this.token.address, amount, fee, nonce);
            await this.token.methods['mint(address,uint256,uint256,uint256,bytes)'](other, amount, fee, nonce, signature, { from: another });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.sub(fee));
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
        });
    
        it('wrapper can burn ETHlessly', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, this.token.address, amount, fee, nonce);
            await this.token.methods['burn(address,uint256,uint256,uint256,bytes)'](other, amount, fee, nonce, signature, { from: deployer });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(amount.sub(fee));
        });

        it('ETHless burn emits a Burnt event', async function () {
            await this.baseToken.mint(other, total, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, total, { from: other });
            await this.token.mint(total, { from: other });
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, this.token.address, amount, fee, nonce);
            receipt = await this.token.methods['burn(address,uint256,uint256,uint256,bytes)'](other, amount, fee, nonce, signature, { from: deployer });

            expectEvent(receipt, 'Burnt', { _burnFrom: other, _value: amount.sub(fee) });
        });
    
        it('another can burn ETHlessly but wrapper gets the fee', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, this.token.address, amount, fee, nonce);
            await this.token.methods['burn(address,uint256,uint256,uint256,bytes)'](other, amount, fee, nonce, signature, { from: another });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(amount.sub(fee));
        });
    });  
});

describe('ERC20WrapperGluwacoin_Reservable', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'ERC20WrapperGluwacoin';
    const symbol = 'WG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const WRAPPER_ROLE = web3.utils.soliditySha3('WRAPPER_ROLE');
    const RELAYER_ROLE = web3.utils.soliditySha3('RELAYER_ROLE');

    beforeEach(async function () {
        // Deploy a new ControlledGluwacoin contract for each test
        this.baseToken = await ERC20PresetMinterPauser.new('Gluwacoin', 'GC', { from: deployer });
        // Deploy a new ERC20WrapperGluwacoin contract for each test
        this.token = await ERC20WrapperGluwacoin.new(name, symbol, decimals, this.baseToken.address, { from: deployer });
    });
    /* Reservable related
    */

    describe('reserve test', async function () {
        it('can reserve', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            nonce = Date.now();
    
            signature = sign.sign(this.token.address, other, other_privateKey, another, send_amount, fee, nonce);
    
            await expectRevert(
                this.token.reserve(other, another, executor, send_amount, fee, nonce, expiryBlockNum, signature, { from: deployer }),
                'ERC20Reservable: insufficient unreserved balance'
            );
        });
    
        it('cannot reserve if not amount + fee > 0', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
    
        it('cannot reserve if nonce is already used', async function () {
            await this.baseToken.mint(other, amount.add(amount), { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount.add(amount), { from: other });
            await this.token.mint(amount.add(amount), { from: other });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.add(amount));
    
            var executor = deployer;
            var reserve_amount = amount.sub(fee);
            var reserve_fee = fee;
            var latestBlock = await time.latestBlock();
            var expiryBlockNum = latestBlock.add(new BN('100'));
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, another, reserve_amount, reserve_fee, nonce);
    
            await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer });
    
            await expectRevert(
                this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer }),
                'ERC20Reservable: the sender used the nonce already'
            );
        });
    
        it('cannot reserve if signature is invalid', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());
    
            var executor = deployer;
            var reserve_amount = amount.sub(fee);
            var reserve_fee = fee;
            var dummy_amount = amount.sub(fee).sub(fee); 
            var latestBlock = await time.latestBlock();
            var expiryBlockNum = latestBlock.add(new BN('100'));
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, another, dummy_amount, reserve_fee, nonce);
    
            await expectRevert(
                this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: deployer }),
                'Validate: invalid signature'
            );
        });
    
        it('getReservation works', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
    });
    
    describe('execute test', async function () {
        it('executor can execute', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
    
        it('cannot execute non existing reserve', async function () {
            var nonce = Date.now();
            await expectRevert(
                this.token.execute(other, nonce, { from: deployer }),
                'ERC20Reservable: reservation does not exist'
            );
        });
    });

    describe('reclaim test', async function () {
        it('executor can reclaim unexpired reserve', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
    
        it('executor cannot reclaim from no reservation', async function () {
            var nonce = Date.now();
            await expectRevert(
                this.token.reclaim(other, nonce, { from: deployer }),
                'ERC20Reservable: reservation does not exist'
            );
        });
    
        it('sender cannot reclaim from no reservation', async function () {
            var nonce = Date.now();
            await expectRevert(
                this.token.reclaim(other, nonce, { from: other }),
                'ERC20Reservable: reservation does not exist'
            );
        });
    
        it('receiver cannot reclaim from no reservation', async function () {
            var nonce = Date.now();
            await expectRevert(
                this.token.reclaim(other, nonce, { from: another }),
                'ERC20Reservable: reservation does not exist'
            );
        });
    });

    describe('after reserve check', async function () {
        it('reservedBalanceOf accurate after reserve', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
    });

    describe('after execute check', async function () {
    
        it('reservedBalanceOf accurate after execute', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });

            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
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
            expect(await this.token.unreservedBalanceOf(other)).to.be.bignumber.equal('0');
        });
    });

    /* ETHless related
    */
    describe('ETHless test', async function () {
        it('deployer has the default relayer role', async function () {
            expect(await this.token.getRoleMemberCount(RELAYER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(RELAYER_ROLE, 0)).to.equal(deployer);
        });
    
        it('relayer can send ETHless transfer', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());
            expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, another, amount.sub(fee), fee, nonce);
    
            await this.token.transfer(other, another, amount.sub(fee), fee, nonce, signature, { from: deployer });
    
            expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOf(another)).to.be.bignumber.equal(amount.sub(fee));
        });
    
        it('cannot send ETHless transfer more than balance', async function () {
            await this.baseToken.mint(other, amount, { from: deployer });
            await this.baseToken.increaseAllowance(this.token.address, amount, { from: other });
            await this.token.mint(amount, { from: other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.toString());
            expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');
    
            var nonce = Date.now();
    
            var signature = sign.sign(this.token.address, other, other_privateKey, another, amount, fee, nonce);
    
            await expectRevert(
                this.token.transfer(other, another, amount, fee, nonce, signature, { from: deployer }),
                'ERC20Reservable: transfer amount exceeds unreserved balance'
            );
        });
    });  
});