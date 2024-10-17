import React, { useState, useEffect } from "react";
import { ethers } from "ethers"; // Correct import for ethers.js
import { encodeBytes32String, parseEther } from 'ethers'; // Import necessary utilities
import FlightRefundABI from './abis/FlightRefundABI.json'; // Adjust the path as necessary

// Contract address (replace with your deployed contract address)
const contractAddress = "0x37dD26d18abeC2d311e82177f9fa58E9DC14b579";

const App = () => {
  const [flightNumber, setFlightNumber] = useState("");
  const [ticketPrice, setTicketPrice] = useState(0);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [price, setPrice] = useState(0);
  const [delayInMinutes, setDelayInMinutes] = useState(30);
  const [refundPercentage, setRefundPercentage] = useState(50);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const connectMetaMask = async () => {
      if (typeof window.ethereum !== "undefined") {
        // Request account access if needed
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } else {
        alert("Please install MetaMask to interact with the blockchain!");
      }
    };

    connectMetaMask();
  }, []);

  // Get contract instance
  const getContract = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const flightRefundContract = new ethers.Contract(contractAddress, FlightRefundABI, signer);
      return flightRefundContract;
    } else {
      alert("Please install MetaMask to interact with the blockchain!");
      return null;
    }
  };

  // Add a new flight (Owner function)
  const handleAddFlight = async () => {
    const contract = await getContract();
    if (contract) {
      try {
        const flightBytes = encodeBytes32String(flightNumber);
          console.log(ticketPrice)
        const tx = await contract.addFlight(flightBytes, ticketPrice);
        await tx.wait();
        alert("Flight added successfully!");
      } catch (error) {
        console.error(error);
        alert("Error adding flight: " + error.message);
      }
    }
  };

  // Purchase tickets for a flight
  const handlePurchaseTickets = async () => {
    const contract = await getContract();
    if (contract) {
      try {
        const flightBytes = encodeBytes32String(flightNumber);
          console.log(price * numberOfTickets)
        const totalCost = parseEther((price*numberOfTickets).toString());
          console.log(totalCost)
        const tx = await contract.purchaseTickets(flightBytes, numberOfTickets, { value: totalCost });
        await tx.wait();
        alert("Tickets purchased successfully!");
      } catch (error) {
        console.error(error);
        alert("Error purchasing tickets: " + error.message);
      }
    }
  };

  // Process refunds if a flight is delayed
  const handleRefund = async () => {
    const contract = await getContract();
    if (contract) {
      try {
        const flightBytes = encodeBytes32String(flightNumber);
        const tx = await contract.processRefund(flightBytes, delayInMinutes);
        await tx.wait();
        alert("Refund processed successfully!");
      } catch (error) {
        console.error(error);
        alert("Error processing refund: " + error.message);
      }
    }
  };

  return (
    <div className="App">
      <h1>Airplane Ticket Refund System</h1>
      {account ? <p>Connected as: {account}</p> : <p>Please connect your MetaMask wallet.</p>}
      
      {/* Add Flight Section */}
      <h2>Add New Flight (Owner Only)</h2>
      <input
        type="text"
        placeholder="Flight Number"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
      />
      <input
        type="number"
        placeholder="Ticket Price (ETH)"
        value={ticketPrice}
        onChange={(e) => setTicketPrice(e.target.value)}
      />
      <button onClick={handleAddFlight}>Add Flight</button>

      {/* Purchase Tickets Section */}
      <h2>Purchase Tickets</h2>
      <input
        type="text"
        placeholder="Flight Number"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
      />
      <input
        type="number"
        placeholder="Number of Tickets"
        value={numberOfTickets}
        onChange={(e) => setNumberOfTickets(e.target.value)}
      />
      <input
        type="number"
        placeholder="Price per Ticket (ETH)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button onClick={handlePurchaseTickets}>Purchase Tickets</button>

      {/* Process Refund Section */}
      <h2>Process Refund</h2>
      <input
        type="text"
        placeholder="Flight Number"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
      />
      <input
        type="number"
        placeholder="Delay (Minutes)"
        value={delayInMinutes}
        onChange={(e) => setDelayInMinutes(e.target.value)}
      />
      <button onClick={handleRefund}>Process Refund</button>
    </div>
  );
};

export default App;
