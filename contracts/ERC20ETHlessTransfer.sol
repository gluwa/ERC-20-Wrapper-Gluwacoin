pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "./Validate.sol";

/**
 * @dev Extension of {ERC20} that allows users to send ETHless transfer by hiring a transaction relayer to pay the
 * gas fee for them. The relayer gets paid in this ERC20 token for `fee`.
 */
contract ERC20ETHlessUpgradeSafe is Initializable, AccessControlUpgradeSafe, ERC20UpgradeSafe {
    using Address for address;
    using ECDSA for bytes32;

    mapping (address => mapping (uint256 => bool)) private _usedNonces;

    // collects transaction relay fee
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    function initialize(string memory name, string memory symbol) public {
        __ERC20ETHless_init(name, symbol);
    }

    function __ERC20ETHless_init(string memory name, string memory symbol) internal
    initializer {
        __ERC20_init_unchained(name, symbol);
        __ERC20ETHless_init_unchained();
    }

    function __ERC20ETHless_init_unchained() internal initializer {
        _setupRole(RELAYER_ROLE, _msgSender());
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`
     * and moves `fee` tokens from the caller's account to zero address.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits two {Transfer} events.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the `sender` must have a balance of at least the sum of `amount` and `fee`.
     * - the `nonce` is only used once per `sender`.
     */
    function transfer(address sender, address recipient, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig)
    public returns (bool success) {
        _useNonce(sender, nonce);

        bytes32 hash = keccak256(abi.encodePacked(address(this), sender, recipient, amount, fee, nonce));
        Validate.validateSignature(hash, sender, sig);

        _collect(sender, fee);
        _transfer(sender, recipient, amount);

        return true;
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     */
    function mint(address to, uint256 amount) virtual public {
        _mint(to, amount);
    }

    /* @dev Uses `nonce` for the signer.
    */
    function _useNonce(address signer, uint256 nonce) private {
        require(!_usedNonces[signer][nonce], "ERC20ETHless: the nonce has already been used for this address");
        _usedNonces[signer][nonce] = true;
    }

    /** @dev Collects `fee` from the sender.
     *
     * Emits a {Transfer} event.
     */
    function _collect(address sender, uint256 amount) internal {
        address relayer = getRoleMember(RELAYER_ROLE, 0);

        _transfer(sender, relayer, amount);
    }

    uint256[50] private __gap;
}