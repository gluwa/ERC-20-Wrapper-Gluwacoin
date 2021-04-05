pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../ExampleCoin.sol";

contract ExampleCoinMock is Initializable, ExampleCoin {

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        IERC20 token
    ) public {
        __ExampleCoinMock_init(name, symbol, decimals, token);
    }

    function __ExampleCoinMock_init(
        string memory name,
        string memory symbol,
        uint8 decimals,
        IERC20 token
    ) internal initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20ETHless_init_unchained();
        __ERC20Reservable_init_unchained();
        __ERC20Wrapper_init_unchained(decimals, token);
        __ERC20WrapperGluwacoin_init_unchained();
    }


    uint256[44] private __gap;
}