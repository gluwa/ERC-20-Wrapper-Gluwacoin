pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the Gluwacoin standard as defined in the whitepaper.
 */
interface IGluwacoin {
    /**
     * @dev Returns the address of the base token.
     */
    function token() external view returns (IERC20);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`
     * and moves `fee` tokens from the caller's account to zero address.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits two {Transfer} events.
     */
    function transfer(address sender, address recipient, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig) external returns (bool);

    /**
     * @dev Emitted when a nonce is used.
     */
    event NonceUsed(address indexed _user, uint256 _nonce);
}
