pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "./abstracts/ERC20ETHlessTransfer.sol";
import "./abstracts/ERC20Reservable.sol";
import "./abstracts/ERC20Wrapper.sol";

/**
 * @dev Extension of {Gluwacoin} that allows a certain ERC20 token holders to wrap the token to mint this token.
 * Holder of this token can retrieve the wrapped token by burning this token.
 */
contract ERC20WrapperGluwacoin is Initializable, ContextUpgradeSafe, ERC20ETHless,
ERC20Reservable, ERC20Wrapper  {
    // note that `decimals` must match that of `token` or less
    function initialize(string memory name, string memory symbol, uint8 decimals, IERC20 token) public {
        __ERC20Wrapper_init(name, symbol, decimals, token);
    }

    function __ERC20WrapperGluwacoin_init(string memory name, string memory symbol, uint8 decimals, IERC20 token)
    internal initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20ETHless_init_unchained();
        __ERC20Reservable_init_unchained();
        __ERC20Wrapper_init_unchained(decimals, token);
        __ERC20WrapperGluwacoin_init_unchained();
    }

    function __ERC20WrapperGluwacoin_init_unchained() internal initializer {
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override
    (ERC20UpgradeSafe, ERC20Reservable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    uint256[50] private __gap;
}