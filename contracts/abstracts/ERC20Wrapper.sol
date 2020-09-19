pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

/**
 * @dev Extension of {ERC20} that allows a certain ERC20 token holders to wrap the token to mint this token.
 * Holder of this token can retrieve the wrapped token by burning this token.
 */
abstract contract ERC20Wrapper is Initializable, ERC20UpgradeSafe {
    // base token, the token to be wrapped
    IERC20 private _token;

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

    uint256[50] private __gap;
}