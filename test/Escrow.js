const { ethers } = require('hardhat');
const { expect } = require('chai');

describe("Escrow contract", function () {
    let buyer;
    let seller;
    let escrow;
    let money;
    let provider;


    beforeEach(async function () {
        [_, buyer, seller] = await ethers.getSigners();
        const escrowContract = await ethers.getContractFactory("Escrow");
    
        money = ethers.utils.parseEther("1.0");
        escrow = await escrowContract.deploy(buyer.address, seller.address, money);

        provider = await ethers.provider; // Hardhat Network (local)

    });


    it("Should allow everyone to check current state", async function () {
        await escrow.connect(buyer).getCurrentState();
        await escrow.connect(seller).getCurrentState();
    })

    it("Should receive correct amount of money from buyer", async function () {
        const etherBalanceOfContractBefore = await provider.getBalance(escrow.address);
        
        // buyer send ethers to the contract
        await buyer.sendTransaction({
            to: escrow.address,
            value: money
        });

        // check current state
        expect(await escrow.getCurrentState()).to.equal(1); // 0: await_payment, 1: await_delivery, 2: complete

        // check balance change
        expect(await provider.getBalance(escrow.address)).to.equal(etherBalanceOfContractBefore.add(money));
    });

    it("Should allow buyer to confirm that the product has been delivered. Right after confirmation, escrow transfer money to seller", async function () {
        // buyer send ethers to the contract
        await buyer.sendTransaction({
            to: escrow.address,
            value: money
        });

        const etherBalanceOfSellerBefore = await provider.getBalance(seller.address);

        // buyer confirms that product has been delivered
        await escrow.connect(buyer).confirmDelivery();

        // check if seller has receive money from escrow
        expect(await provider.getBalance(seller.address)).to.equal(etherBalanceOfSellerBefore.add(money));

        // check current state
        expect(await escrow.getCurrentState()).to.equal(2); // 0: await_payment, 1: await_delivery, 2: complete
    })
});