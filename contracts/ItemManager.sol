// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "./Ownable.sol";
import "./Item.sol";

contract ItemManager is Ownable{
    enum SupplyChainState{Created, InTransit, Delivered, Evaluated, Paid}
    enum SupplyChainQuality{Good, Bad}

    struct S_Item {
        Item _item;
        string _identifier;
        uint _itemPrice;
        ItemManager.SupplyChainState _state;
        uint _itemQuality;


    }
    mapping(uint =>  S_Item) public items;
    uint itemIndex;

    event SupplyChainSetState(uint _itemIndex, uint _itemState);
    event SupplyChainSetPrice(uint _itemIndex, uint _itemPrice);
    event SupplyChainSetItemAddress(uint _itemIndex, address _itemAddress);

    function createItem(string memory _identifier, uint _itemPrice) public onlyOwner{
        Item item = new Item(this, itemIndex);
        items[itemIndex]._item = item;
        items[itemIndex]._identifier = _identifier;
        items[itemIndex]._itemPrice = _itemPrice;
        items[itemIndex]._itemQuality = 10;
        items[itemIndex]._state = SupplyChainState.Created;

        emit SupplyChainSetState(itemIndex, uint(items[itemIndex]._state));
        emit SupplyChainSetItemAddress(itemIndex, address(item));
        itemIndex++;
    }

    function triggerDelivery(uint _itemIndex) public onlyOwner{
        require(items[_itemIndex]._state == SupplyChainState.Created, "The item has already been created");
        items[_itemIndex]._state = SupplyChainState.InTransit;
        emit SupplyChainSetState(_itemIndex, uint(items[itemIndex]._state));
    }

    function triggerArrival(uint _itemIndex) public {
        require(items[_itemIndex]._state == SupplyChainState.InTransit, "The item must be in transit");
        items[_itemIndex]._state = SupplyChainState.Delivered;

        emit SupplyChainSetState(_itemIndex, uint(items[_itemIndex]._itemPrice));


    }

    function triggerExamination(uint _itemIndex, uint _itemQuality) public {
        require(items[_itemIndex]._state == SupplyChainState.Delivered, "The item must be delivered");
        items[_itemIndex]._state = SupplyChainState.Evaluated;
        items[_itemIndex]._itemQuality = _itemQuality;

        uint newPrice = items[_itemIndex]._itemPrice * (10 - _itemQuality)/100;
        newPrice = items[_itemIndex]._itemPrice - newPrice;

        items[_itemIndex]._itemPrice = newPrice;

        emit SupplyChainSetState(_itemIndex, uint(items[_itemIndex]._state));
        emit SupplyChainSetPrice(_itemIndex, uint(items[_itemIndex]._itemPrice));


    }

    function triggerPayment(uint _itemIndex) public payable {
        require(items[_itemIndex]._itemPrice == msg.value, "Only full payments");
        require(items[_itemIndex]._state == SupplyChainState.Evaluated, "The item has not been evaluated");
        items[_itemIndex]._state = SupplyChainState.Paid;

        emit SupplyChainSetState(_itemIndex, uint(items[_itemIndex]._state));
    }
}