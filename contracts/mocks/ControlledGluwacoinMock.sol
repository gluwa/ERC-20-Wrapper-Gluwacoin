pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../ControlledGluwacoin.sol";

contract ControlledGluwacoinMock is Initializable, ControlledGluwacoin {

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public {
        __ControlledGluwacoinMock_init(name, symbol, decimals);
    }

    function __ControlledGluwacoinMock_init(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) internal initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20ETHless_init_unchained();
        __ERC20Reservable_init_unchained();
        __ERC20Controllable_init_unchained(decimals);
    }

    function __ERC20Controllable_init_unchained(
        uint8 decimals
    ) internal override initializer {
        _setupDecimals(decimals);
        _setupRole(CONTROLLER_ROLE, _msgSender());
    }


    uint256[50] private __gap;
}