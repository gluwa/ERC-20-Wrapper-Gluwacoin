pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

import "./IGluwacoin.sol";

/**
 * @dev Extension of {ERC20} that has a base token for its token.
 */
contract GluwacoinBasedUpgradeSafe is Initializable, ContextUpgradeSafe, ERC20UpgradeSafe, IGluwacoin {
    using ECDSA for bytes32;
    using SafeMath for uint256;

    // base token
    IERC20 private _token;

    enum ReservationStatus {
        Inactive,
        Active,
        Expired,
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
        __ERC20_init_unchained(name, symbol);
        __GluwacoinBased_init_unchained(token);
    }

    function __GluwacoinBased_init_unchained(IERC20 token) internal initializer {
        _token = token;
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

        _transfer(sender, recipient, amount);
        _transfer(sender, address(0), amount);

        return true;
    }

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