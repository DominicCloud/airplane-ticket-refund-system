const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlightRefund Contract", function () {
  let flightRefund;
  let owner;
  let passenger1;
  let passenger2;
  let flightNumber;
  let ticketPrice;
  let numberOfTickets;

  beforeEach(async function () {
    [owner, passenger1, passenger2] = await ethers.getSigners();

    // Deploy the contract
    const FlightRefund = await ethers.getContractFactory("FlightRefund");
    flightRefund = await FlightRefund.deploy();
    await flightRefund.deployed();

    flightNumber = ethers.utils.formatBytes32String("FLIGHT1"); // Sample flight number
    ticketPrice = ethers.utils.parseEther("1"); // Ticket price in 1 ETH
    numberOfTickets = 2; // Number of tickets to purchase
  });

  it("should deploy and set the correct owner", async function () {
    const contractOwner = await flightRefund.owner();
    expect(contractOwner).to.equal(owner.address);
  });

  it("should add a flight successfully by the owner", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);
    const flight = await flightRefund.flights(flightNumber);
    expect(flight.ticketPrice).to.equal(ticketPrice);
    expect(flight.isActive).to.be.true;
  });

  it("should revert if a non-owner tries to add a flight", async function () {
    await expect(flightRefund.connect(passenger1).addFlight(flightNumber, ticketPrice)).to.be.revertedWith(
      "Only the owner can call this function"
    );
  });

  it("should allow passengers to purchase tickets", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);

    const totalCost = ticketPrice.mul(numberOfTickets);
    await expect(
      flightRefund.connect(passenger1).purchaseTickets(flightNumber, numberOfTickets, { value: totalCost })
    ).to.emit(flightRefund, "TicketsPurchased");

    const ticketCount = await flightRefund.getTicketCount(flightNumber, passenger1.address);
    expect(ticketCount).to.equal(numberOfTickets);
  });

  it("should revert if the ticket payment is incorrect", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);
    const incorrectCost = ticketPrice.mul(numberOfTickets).sub(ethers.utils.parseEther("0.1")); // less than required

    await expect(
      flightRefund.connect(passenger1).purchaseTickets(flightNumber, numberOfTickets, { value: incorrectCost })
    ).to.be.revertedWith("Incorrect payment amount");
  });

  it("should allow passengers to process a refund for delayed flights", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);

    const totalCost = ticketPrice.mul(numberOfTickets);
    await flightRefund.connect(passenger1).purchaseTickets(flightNumber, numberOfTickets, { value: totalCost });

    const initialBalance = await ethers.provider.getBalance(passenger1.address);

    await expect(
      flightRefund.connect(passenger1).processRefund(flightNumber, 40) // Delay of 40 minutes
    ).to.emit(flightRefund, "RefundIssued");

    const finalBalance = await ethers.provider.getBalance(passenger1.address);
    expect(finalBalance).to.be.above(initialBalance);
  });

  it("should revert refund processing if delay is less than minimum", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);

    const totalCost = ticketPrice.mul(numberOfTickets);
    await flightRefund.connect(passenger1).purchaseTickets(flightNumber, numberOfTickets, { value: totalCost });

    await expect(flightRefund.connect(passenger1).processRefund(flightNumber, 20)) // Delay less than 30 minutes
      .to.be.revertedWith("Delay must be at least 30 minutes");
  });

  it("should allow the owner to withdraw funds", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);

    const totalCost = ticketPrice.mul(numberOfTickets);
    await flightRefund.connect(passenger1).purchaseTickets(flightNumber, numberOfTickets, { value: totalCost });

    const contractBalance = await ethers.provider.getBalance(flightRefund.address);
    expect(contractBalance).to.equal(totalCost);

    await expect(flightRefund.connect(owner).withdrawFunds()).to.changeEtherBalance(owner, totalCost);
  });

  it("should revert withdrawal for non-owners", async function () {
    await flightRefund.connect(owner).addFlight(flightNumber, ticketPrice);
    await expect(flightRefund.connect(passenger1).withdrawFunds()).to.be.revertedWith(
      "Only the owner can call this function"
    );
  });
});
