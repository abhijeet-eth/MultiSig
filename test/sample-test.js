const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multisig", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Multisig = await ethers.getContractFactory("Multisig");
    const multisig = await Multisig.deploy();
    await multisig.deployed();

    expect(await multisig.getBalance()).to.equal();

    const setGreetingTx = await multisig.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
