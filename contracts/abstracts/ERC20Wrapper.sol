pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../Validate.sol";

/**
 * @dev Extension of {ERC20} that allows a certain ERC20 token holders to wrap the token to mint this token.
 * Holder of this token can retrieve the wrapped token by burning this token.
 */
abstract contract ERC20Wrapper is Initializable, AccessControlUpgradeSafe, ERC20UpgradeSafe {
    using Address for address;
    // base token, the token to be wrapped
    IERC20 private _token;

    mapping (address => mapping (uint256 => bool)) private _usedNonces;

    // collects mint/burn relay fee
    bytes32 public constant WRAPPER_ROLE = keccak256("WRAPPER_ROLE");

    event Mint(address indexed _mintTo, uint256 _value);
    event Burnt(address indexed _burnFrom, uint256 _value);

    function __ERC20Wrapper_init(string memory name, string memory symbol, uint8 decimals, IERC20 token) internal
    initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Wrapper_init_unchained(decimals, token);
    }

    function __ERC20Wrapper_init_unchained(uint8 decimals, IERC20 token) internal virtual initializer {
        _setupDecimals(decimals);
        _setupToken(token);
        _setupRole(WRAPPER_ROLE, _msgSender());
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
        __mint(_msgSender(), amount);
    }

    /**
     * @dev `mint` but with `minter`, `fee`, `nonce`, and `sig` as extra parameters.
     * `fee` is a mint fee amount in Gluwacoin, which the minter will pay for the mint.
     * `sig` is a signature created by signing the mint information with the minter’s private key.
     * Anyone can initiate the mint for the minter by calling the Etherless Mint function
     * with the mint information and the signature.
     * The caller will have to pay the gas for calling the function.
     *
     * Transfers `amount` + `fee` of base tokens from the minter to the contract using `transferFrom`.
     * Creates `amount` + `fee` of tokens to the minter and transfers `fee` tokens to the caller.
     *
     * See {ERC20-_mint} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the minter must have base tokens of at least `amount` + `fee`.
     * - the contract must have allowance for receiver's base tokens of at least `amount` + `fee`.
     */
    function mint(address minter, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig) public {
        address wrapper = getRoleMember(WRAPPER_ROLE, 0);

        _useWrapperNonce(minter, nonce);
        Validate.validateSignature(address(this), minter, address(this), amount, fee, nonce, sig);

        uint256 total = amount.add(fee);
        __mint(minter, total);

        _transfer(minter, wrapper, fee);
    }

    /**
     * @dev Destroys `amount` tokens from the caller, transferring base tokens from the contract to the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public {
        __burn(_msgSender(), amount);
    }

    /**
     * @dev `burn` but with `burner`, `fee`, `nonce`, and `sig` as extra parameters.
     * `fee` is a burn fee amount in Gluwacoin, which the burner will pay for the burn.
     * `sig` is a signature created by signing the burn information with the burner’s private key.
     * Anyone can initiate the burn for the burner by calling the Etherless Burn function
     * with the burn information and the signature.
     * The caller will have to pay the gas for calling the function.
     *
     * Destroys `amount` + `fee` tokens from the burner.
     * Transfers `amount` of base tokens from the contract to the burner and `fee` of base token to the caller.
     *
     * See {ERC20-_burn}.
     *
     * Requirements:
     *
     * - the burner must have tokens of at least `amount` + `fee`.
     */
    function burn(address burner, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig) public {
        _useWrapperNonce(burner, nonce);
        Validate.validateSignature(address(this), burner, address(this), amount, fee, nonce, sig);

        address wrapper = getRoleMember(WRAPPER_ROLE, 0);
        _transfer(burner, wrapper, fee);

        __burn(burner, amount);
    }

    function __mint(address account, uint256 amount) internal {
        require(_token.transferFrom(account, address(this), amount), "ERC20Wrapper: could not deposit base tokens");

        emit Mint(account, amount);

        _mint(account, amount);
    }

    function __burn(address account, uint256 amount) internal {
        require(_token.transfer(account, amount), "ERC20Wrapper: could not withdraw base tokens");

        emit Burnt(account, amount);

        _burn(account, amount);
    }

    /**
     * @dev Sets {token} as the base token.
     *
     * WARNING: This function should only be called from the constructor. Most
     * applications that interact with token contracts will not expect
     * {token} to ever change, and may work incorrectly if it does.
     */
    function _setupToken(IERC20 token_) internal {
        _token = token_;
    }

    /* @dev Uses `nonce` for the signer.
    */
    function _useWrapperNonce(address signer, uint256 nonce) private {
        require(!_usedNonces[signer][nonce], "ERC20Wrapper: the nonce has already been used for this address");
        _usedNonces[signer][nonce] = true;
    }

    uint256[50] private __gap;
}