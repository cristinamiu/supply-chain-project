// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "./ItemManager.sol";
contract Item {
    uint public index;

    ItemManager parentContract;

    constructor(ItemManager _parentContract, uint _index) public {
        index = _index;
        parentContract = _parentContract;
    }

    receive() external payable {
        (bool success, ) = address(parentContract).call.value(msg.value)(abi.encodeWithSignature("triggerPayment(uint256)", index));
        require(success, "The transaction wasn't successful, canceling");
    }



}
