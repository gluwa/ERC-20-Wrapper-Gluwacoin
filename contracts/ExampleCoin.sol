// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "./ERC20WrapperGluwacoin.sol";

/**
 * @dev Example usage of {ERC20WrapperGluwacoin}.
 */
contract ExampleCoin is ERC20WrapperGluwacoin  {
    // note that `decimals` must match that of `token` or less
    function initialize(string memory name, string memory symbol, uint8 decimals, IERC20 token) public override {
        __ExampleCoin_init(name, symbol, decimals, token);
    }

    function __ExampleCoin_init(string memory name, string memory symbol, uint8 decimals, IERC20 token)
    internal initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20ETHless_init_unchained();
        __ERC20Reservable_init_unchained();
        __ERC20Wrapper_init_unchained(decimals, token);
        __ERC20WrapperGluwacoin_init_unchained();
        __ExampleCoin_init_unchained();
    }

    function __ExampleCoin_init_unchained() internal initializer {}

    uint256[50] private __gap;
}