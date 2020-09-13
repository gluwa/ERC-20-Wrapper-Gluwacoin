pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

import "./IGluwacoin.sol";

/**
 * @dev Extension of {ERC20} that has a base token for its token.
 */
contract GluwacoinBasedUpgradeSafe is Initializable, ContextUpgradeSafe, AccessControlUpgradeSafe, ERC20UpgradeSafe, ERC20PausableUpgradeSafe, IGluwacoin {
    using ECDSA for bytes32;
    using SafeMath for uint256;

    // base token
    IERC20 private _token;
    bytes32 public constant COLLECTOR_ROLE = keccak256("COLLECTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant RECLAIMER_ROLE = keccak256("RECLAIMER_ROLE");

    enum ReservationStatus {
        Active,
        Reclaimed,
        Completed
    }

    struct Reservation {
        uint256 _amount;
        uint256 _fee;
        address _recipient;
        address _executor;
        uint256 _expiryBlockNum;
        ReservationStatus _status;
    }

    // Address mapping to mapping of nonce to amount and expiry for that nonce.
    mapping (address => mapping(uint256 => Reservation)) private _reserved;

    // Total amount of reserved balance for address
    mapping (address => uint256) private _totalReserved;

    mapping (address => mapping (uint256 => bool)) _usedNonces;

    function initialize(string memory name, string memory symbol, IERC20 token) public {
        __GluwacoinBasedMintable_init(name, symbol, token);
    }

    function __GluwacoinBasedMintable_init(string memory name, string memory symbol, IERC20 token) internal initializer {
        __Context_init_unchained();
        __AccessControl_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __GluwacoinBased_init_unchained(token);
    }

    function __GluwacoinBased_init_unchained(IERC20 token) internal initializer {
        _token = token;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(COLLECTOR_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(RECLAIMER_ROLE, _msgSender());
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have pauser role to pause");
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have pauser role to unpause");
        _unpause();
    }

    /**
     * @dev Returns the address of the base token.
     */
    function token() public view override returns (IERC20) {
        return _token;
    }

    /**
     * @dev Creates `amount` tokens to the caller, transferring base tokens from the caller to the contract.
     *
     * See {ERC20-_mint} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have base tokens of at least `amount`.
     * - the contract must have allowance for caller's base tokens of at least
     * `amount`.
     */
    function mint(uint256 amount) public virtual {
        require(_token.transferFrom(_msgSender(), address(this), amount), "Gluwacoin: could not deposit base tokens");

        _mint(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from the caller, transferring base tokens from the contract to the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public virtual {
        require(_token.transfer(_msgSender(), amount), "Gluwacoin: could not withdraw base tokens");

        _burn(_msgSender(), amount);
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`
     * and moves `fee` tokens from the caller's account to zero address.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits two {Transfer} events.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least the sum of `amount` and `fee`.
     */
    function transfer(address sender, address recipient, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig) public override returns (bool success) {
        bytes32 hash = keccak256(abi.encodePacked(address(this), sender, recipient, amount, fee, nonce));
        _validateSignature(hash, sender, nonce, sig);

        _collect(sender, fee);
        _transfer(sender, recipient, amount);

        return true;
    }

    function reserve(address sender, address recipient, address executor, uint256 amount, uint256 fee, uint256 nonce, uint256 expiryBlockNum, bytes memory sig) public returns (bool success) {
        require(expiryBlockNum > block.number, "Gluwacoin: invalid block expiry number");
        require(amount > 0, "Gluwacoin: invalid reserve amount");
        require(executor != address(0), "Gluwacoin: cannot execute from zero address");

        bytes32 hash = keccak256(abi.encodePacked(address(this), sender, recipient, executor, amount, fee, nonce, expiryBlockNum));
        _validateSignature(hash, sender, nonce, sig);

        _reserved[sender][nonce] = Reservation(amount, fee, recipient, executor, expiryBlockNum, ReservationStatus.Active);
        _totalReserved[sender] = _totalReserved[sender].add(amountPlusFee);

        return true;
    }

    function execute(address sender, uint256 nonce) public returns (bool success) {
        Reservation storage reservation = _reserved[sender][nonce];

        require(reservation._status == ReservationStatus.Active, "Gluwacoin: invalid reservation to execute");
        require(reservation._expiryBlockNum > block.number, "Gluwacoin: reservation has expired and can not be executed");
        require(reservation._executor == _msgSender(), "Gluwacoin: this address is not authorized to execute this reservation");

        uint256 fee = reservation._fee;
        uint256 amount = reservation._amount;
        uint256 total = amount.add(fee);
        address recipient = reservation._recipient;

        _reserved[sender][nonce]._status = ReservationStatus.Completed;
        _totalReserved[sender] = _totalReserved[sender].subtract(total);

        _collect(sender, fee);
        _transfer(sender, recipient, amount);

        return true;
    }

    function reclaim(address sender, uint256 nonce) public returns (bool success) {
        Reservation storage reservation = _reserved[sender][nonce];

        if (hasRole(RECLAIMER_ROLE, _msgSender()) == false)
        {
            require(_msgSender() == sender, "Gluwacoin: cannot reclaim another user's reservation for them");
            require(reservation._status == ReservationStatus.Active, "Gluwacoin: invalid reservation to execute");
        }

        _reserved[sender][nonce]._status = ReservationStatus.Reclaimed;
        _totalReserved[sender] = _totalReserved[sender].subtract(reservation._amount).subtract(reservation._fee);

        return true;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20UpgradeSafe, ERC20PausableUpgradeSafe) {
        require(_balances[from].subtract(_totalReserved[from]) >= amount, "Gluwacoin: transfer amount exceeds unreserved balance");

        super._beforeTokenTransfer(from, to, amount);
    }

    /** @dev Collects `fee` from the sender.
     *
     * Emits a {Transfer} event.
     */
    function _collect(address sender, uint256 amount) internal {
        address collector = getRoleMember(COLLECTOR_ROLE, 0);

        _transfer(sender, collector, amount);
    }

    /** @dev Validates if `sig` is a valid signature for the ETHless transfer.
     *
     * Emits a {NonceUsed} event with `sender` and `nonce`.
     *
     * Requirements
     *
     * - `sender` should match the signer of the `sig`
     * - `nonce` should never have been used by the `sender`
     */
    function _validateSignature(bytes32 hash, address sender, uint256 nonce, bytes memory sig) internal {
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Gluwacoin: invalid signature");

        require(!_usedNonces[signer][nonce], "Gluwacoin: the nonce has already been used for this address");
        _usedNonces[signer][nonce] = true;

        emit NonceUsed(signer, nonce);
    }

    uint256[50] private __gap;
}