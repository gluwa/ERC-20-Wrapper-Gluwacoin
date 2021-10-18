// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./abstracts/ERC20ETHlessTransfer.sol";
import "./abstracts/ERC20Reservable.sol";
import "./abstracts/ERC20Wrapper.sol";

/**
 * @dev Extension of {Gluwacoin} that allows a certain ERC20 token holders to wrap the token to mint this token.
 * Holder of this token can retrieve the wrapped token by burning this token.
 */
contract ERC20WrapperGluwacoin is
    Initializable,
    ContextUpgradeable,
    ERC20Wrapper,
    ERC20ETHless,
    ERC20Reservable
{
    uint8 private _decimals;

    /// @dev `decimals` must match that of `token`
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        IERC20Upgradeable token
    ) public virtual {
        __ERC20WrapperGluwacoin_init(name, symbol, decimals_, token);
    }

    /// @notice Return a number of decimals of the token
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function __ERC20WrapperGluwacoin_init(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        IERC20Upgradeable token
    ) internal initializer {
        _decimals = decimals_;
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Wrapper_init_unchained(token);
        __ERC20ETHless_init_unchained();
        __ERC20Reservable_init_unchained();
        __ERC20WrapperGluwacoin_init_unchained(decimals_);
    }

    function __ERC20WrapperGluwacoin_init_unchained(uint8 decimals_)
        internal
        initializer
    {
        _decimals = decimals_;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20Reservable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    uint256[50] private __gap;
}
