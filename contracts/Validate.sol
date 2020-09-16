pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

/**
 * @dev Signature verification
 */
library Validate {
    using Address for address;
    using ECDSA for bytes32;

    /**
     * @dev Throws if given `sig` is an incorrect signature of the `sender`.
     */
    function validateSignature(address contractAddress, address sender, address recipient, uint256 amount, uint256 fee,
        uint256 nonce, bytes memory sig) internal pure returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(contractAddress, sender, recipient, amount, fee, nonce));
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Validate: invalid signature");
    }
}
