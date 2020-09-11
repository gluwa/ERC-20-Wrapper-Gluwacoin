pragma solidity ^0.6.2;

// Import base Initializable contract
//import "@openzeppelin/upgrades/contracts/Initializable.sol";

// Import the IERC20 interface and and SafeMath library
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";


contract ERC20Gluwacoin is Initializable, ERC20UpgradeSafe {
    using SafeMath for uint256;
    using Address for address;

    // Contract state: origin token
    IERC20 public token;

    // Initializer function (replaces constructor)
    function initialize(IERC20 _token) public initializer {
        token = _token;
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    // The token holder needs to calls approve to set an allowance of tokens that the contract can use.
    // https://forum.openzeppelin.com/t/example-on-how-to-use-erc20-token-in-another-contract/1682
    function mint(uint256 amount) public virtual returns (bool success) {
        require(token.transferFrom(msg.sender, address(this), amount), "Must have deposit token to the contract to mint");

        _mint(msg.sender, amount);

        return true;
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    //function burn(uint256 amount) public override returns (bool success) {
    function burn(uint256 amount) public virtual returns (bool success) {
        //require(_balances[msg.sender] >= amount, "ERC20: burn amount exceeds balance");
        require(balanceOf(msg.sender) >= amount, "ERC20: burn amount exceeds balance");

        _burn(msg.sender, amount);

        require(token.transfer(msg.sender, amount));

        return true;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20UpgradeSafe) {
        super._beforeTokenTransfer(from, to, amount);
    }
}