pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../Validate.sol";

/**
 * @dev Extension of {ERC20} that allows a certain ERC20 token holders to wrap the token to mint this token.
 * Holder of this token can retrieve the wrapped token by burning this token.
 */
abstract contract ERC20WrapperUpgradeSafe is Initializable, AccessControlUpgradeSafe, ERC20UpgradeSafe {
    // base token, the token to be wrapped
    IERC20 private _token;

    mapping (address => mapping (uint256 => bool)) private _usedNonces;

    // collects burn relay fee
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    event Mint(address indexed _mintTo, uint256 _value);
    event Burnt(address indexed _burnFrom, uint256 _value);

    function __ERC20Wrapper_init(string memory name, string memory symbol, uint8 decimals, IERC20 token) internal
    initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Wrapper_init_unchained(decimals, token);
    }

    function __ERC20Wrapper_init_unchained(uint8 decimals, IERC20 token) internal initializer {
        _token = token;
        _setupDecimals(decimals);
        _setupRole(BURNER_ROLE, _msgSender());
    }

    /**
     * @dev Returns the address of the base token.
     */
    function token() public view returns (IERC20) {
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
    function mint(uint256 amount) public {
        require(_token.transferFrom(_msgSender(), address(this), amount),
            "ERC20Wrapper: could not deposit base tokens");

        _mint(_msgSender(), amount);

        emit Mint(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from the caller, transferring base tokens from the contract to the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public {
        require(_token.transfer(_msgSender(), amount), "ERC20Wrapper: could not withdraw base tokens");

        _burn(_msgSender(), amount);

        emit Burnt(_msgSender(), amount);
    }

    /**
     * @dev ETHless {ERC20-_burn}.
     * Destroys `amount` tokens from the `sender`'s account
     * and moves `fee` tokens from the `sender`'s account to a burner's account.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits two {Transfer} events.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the `sender` must have a balance of at least the sum of `amount` and `fee`.
     * - the `nonce` is only used once per `sender`.
     */
    function burn(address sender, address recipient, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig)
    public {
        _useNonce(sender, nonce);

        Validate.validateSignature(address(this), sender, recipient, amount, fee, nonce, sig);

        _collect(sender, fee);
        _burn(sender, amount);

        emit Burnt(sender, amount);
    }

    /* @dev Uses `nonce` for the signer.
    */
    function _useNonce(address signer, uint256 nonce) private {
        require(!_usedNonces[signer][nonce], "ERC20Wrapper: the nonce has already been used for this address");
        _usedNonces[signer][nonce] = true;
    }

    /** @dev Collects `fee` from the sender.
     *
     * Emits a {Transfer} event.
     */
    function _collect(address sender, uint256 amount) internal {
        address burner = getRoleMember(BURNER_ROLE, 0);

        _transfer(sender, burner, amount);
    }

    uint256[50] private __gap;
}