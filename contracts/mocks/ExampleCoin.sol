// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "../ERC20WrapperGluwacoin.sol";

/**
 * @dev Example usage of {ERC20WrapperGluwacoin}.
 */
contract ExampleCoin is ERC20WrapperGluwacoin {
    uint8 private _exampleDecimals;

    /// @custom:oz-upgrades-unsafe-allow missing-initializer-call
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        IERC20Upgradeable token
    ) public override {
        _exampleDecimals = decimals_;
        __ERC20WrapperGluwacoin_init(name, symbol, decimals_, _msgSender(), token);
    }

    function decimals() public view override returns (uint8) {
        return _exampleDecimals;
    }
}
