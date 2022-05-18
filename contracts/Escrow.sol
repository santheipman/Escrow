// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {
    enum State{ await_payment, await_delivery, complete }

    // variables
    address private buyer;
    address private seller;
    uint256 private money;
    State private state;

    event ChangeState(State _state);
    event Transfer(address indexed _from, address indexed _to, uint value);

    // constructor
    constructor(address _buyer, address _seller, uint _money) {
        // owner = msg.sender;
        buyer = _buyer;
        seller = _seller;
        money = _money;
        state = State.await_payment;

        emit ChangeState(state);
    }

    // only buyer can transfer money to escrow & confirm
    // that the product has been delivered
    modifier onlyBuyer {
        require(msg.sender == buyer);
        _;
    }

    // buyer sends money to escrow
    receive() external onlyBuyer payable { 
        require(msg.value == money, "Amount of money is not correct");
        require(state == State.await_payment, "Buyer can send money only once");
        state = State.await_delivery;

        emit Transfer(buyer, address(this), money);
        emit ChangeState(state);
    }

    // check the state
    function getCurrentState() external view returns(uint8) {
        if (state == State.await_payment) {
            return 0;
        } else if (state == State.await_delivery) {
            return 1;
        } else {
            return 2;
        }
    }

    // buyer confirms that he/she has received the product
    function confirmDelivery() external onlyBuyer {
        require(state == State.await_delivery, "Buyer needs to send money first");
        payable(seller).transfer(money); // send money from contract to seller
        state = State.complete;

        emit Transfer(address(this), seller, money);
        emit ChangeState(state);
    }
}