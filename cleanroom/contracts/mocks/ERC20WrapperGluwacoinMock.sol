pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../ERC20WrapperGluwacoin.sol";

contract ERC20WrapperGluwacoinMock is Initializable, ERC20WrapperGluwacoin {

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        IERC20 token
    ) public {
        __ERC20WrapperGluwacoinMock_init(name, symbol, decimals, token);
    }

    function __ERC20WrapperGluwacoinMock_init(
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

    function __ERC20Wrapper_init_unchained(
        uint8 decimals,
        IERC20 token
    ) internal override initializer {
        _setupDecimals(decimals);
        _setupToken(token);
        _setupRole(WRAPPER_ROLE, _msgSender());
    }


    uint256[50] private __gap;
}