// scripts/deploy.js
// Deployed Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

//Deploy command : npx hardhat run scripts/deploy.js --network localhost
const hre = require("hardhat");

async function main() {
  // Get the contract factory to deploy the contract
  const FlightRefund = await hre.ethers.getContractFactory("FlightRefund");

  // Deploy the contract
  const flightRefund = await FlightRefund.deploy();

  // Wait until the transaction is mined
  await flightRefund.deployed();

  console.log("FlightRefund contract deployed to:", flightRefund.address);
}

// Main function call pattern
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
