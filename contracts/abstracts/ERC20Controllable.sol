pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

/**
 * @dev Extension of {ERC20} that allows a certain ERC20 token holders to wrap the token to mint this token.
 * Holder of this token can retrieve the wrapped token by burning this token.
 */
abstract contract ERC20Controllable is Initializable, AccessControlUpgradeSafe, ERC20UpgradeSafe {
    event Mint(address indexed _mintTo, uint256 _value);
    event Burnt(address indexed _burnFrom, uint256 _value);

    // controls circulation supply by minting and burning
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    function __ERC20Controllable_init(string memory name, string memory symbol, uint8 decimals) internal
    initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Controllable_init_unchained(decimals);
    }

    function __ERC20Controllable_init_unchained(uint8 decimals) internal virtual initializer {
        _setupDecimals(decimals);
        _setupRole(CONTROLLER_ROLE, _msgSender());
    }

    /**
     * @dev Creates `amount` tokens to the caller
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have a `CONTROLLER_ROLE`.
     */
    function mint(uint256 amount) public {
        require(hasRole(CONTROLLER_ROLE, _msgSender()), "ERC20Controllable: only controllers can call this method");

        _mint(_msgSender(), amount);

        emit Mint(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     *
     * - the caller must have a `CONTROLLER_ROLE`.
     */
    function burn(uint256 amount) public {
        require(hasRole(CONTROLLER_ROLE, _msgSender()), "ERC20Controllable: only controllers can call this method");

        _burn(_msgSender(), amount);

        emit Burnt(_msgSender(), amount);
    }

    uint256[50] private __gap;
}