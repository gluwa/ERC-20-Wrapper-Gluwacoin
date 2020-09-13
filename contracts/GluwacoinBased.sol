pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

/**
 * @dev Extension of {ERC20} that has a base token for its token.
 */
contract GluwacoinBasedUpgradeSafe is Initializable, ContextUpgradeSafe, ERC20UpgradeSafe {
    // base token
    IERC20 private _token;

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

    uint256[50] private __gap;
}