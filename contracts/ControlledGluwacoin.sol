pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "./abstracts/ERC20ETHlessTransfer.sol";
import "./abstracts/ERC20Reservable.sol";
import "./abstracts/ERC20Controllable.sol";

/**
 * @dev Extension of {Gluwacoin} that allows the owner of the contract to mint or burn this token.
 */
contract ControlledGluwacoin is Initializable, ContextUpgradeSafe, ERC20UpgradeSafe, ERC20ETHless,
ERC20Reservable, ERC20Controllable  {
    // note that `decimals` must match that of `token` or less
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        __ControlledGluwacoin_init(name, symbol, decimals);
    }

    function __ControlledGluwacoin_init(string memory name, string memory symbol, uint8 decimals)
    internal initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20ETHless_init_unchained();
        __ERC20Reservable_init_unchained();
        __ERC20Controllable_init_unchained(decimals);
        __ControlledGluwacoin_init_unchained();
    }

    function __ControlledGluwacoin_init_unchained() internal initializer {
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override
    (ERC20UpgradeSafe, ERC20Reservable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    uint256[50] private __gap;
}