// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
<<<<<<< HEAD
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
=======
>>>>>>> master

/**
 * @dev Signature verification
 */
<<<<<<< HEAD
library Validate {
    using AddressUpgradeable for address;
=======
library Validate {    
>>>>>>> master
    using ECDSAUpgradeable for bytes32;

    /**
     * @dev Throws if given `sig` is an incorrect signature of the `sender`.
     */
    function validateSignature(bytes32 hash, address sender, bytes memory sig) internal pure {
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Validate: invalid signature");
    }
}
