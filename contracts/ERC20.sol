pragma solidity ^0.6.2;

// Import the IERC20 interface and and SafeMath library
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

/**
 * @dev Generic ERC20 token.
 *
 * Step 1 - ERC20
 * Step 2 - Gluwacoin
 * Step 3 - ERC20-Wrapper Gluwacoin
 */
contract ERC20 is Initializable, ERC20UpgradeSafe {

    // Reserved storage space to allow for layout changes in the future.
    // https://github.com/OpenZeppelin/openzeppelin-sdk/issues/912
    uint256[50] private __gap;
}