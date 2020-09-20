pragma solidity ^0.6.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ControlledGluwacoin.sol";

contract TestControlledGluwacoinUpgradeSafe {
  function testInitialBalanceWithNewControlledGluwacoin() public {
    ControlledGluwacoin meta = new ControlledGluwacoin();

    uint expected = 0;

    Assert.equal(meta.balanceOf(tx.origin), expected, "Owner should have 0 MetaCoin initially");
  }
}