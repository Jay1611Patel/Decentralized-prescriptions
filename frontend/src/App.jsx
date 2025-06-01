import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract ABIs
import MedicalAccessABI from './abi/MedicalAccess.json';
import PrescriptionRegistryABI from './abi/PrescriptionRegistry.json';
import PrescriptionTokenABI from './abi/PrescriptionToken.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [contracts, setContracts] = useState({
    medicalAccess: null,
    prescriptionRegistry: null,
    prescriptionToken: null
  });
  const [systemAddresses, setSystemAddresses] = useState({
    medicalAccess: '',
    prescriptionRegistry: '',
    prescriptionToken: ''
  });

  // Initialize Ethereum connection
  const initEthereum = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        const signer = await provider.getSigner();
        setSigner(signer);
        
        // You might want to deploy a new system or use existing addresses
        // For now, we'll assume you have deployed contracts
        const factoryAddress = 'YOUR_FACTORY_ADDRESS';
        // ... initialize contracts here
        
        console.log("Ethereum initialized");
      } catch (error) {
        console.error("Error connecting to Ethereum:", error);
      }
    } else {
      console.log("Please install MetaMask!");
    }
  };

  useEffect(() => {
    initEthereum();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Decentralized Prescription System</h1>
        <p>Connected Account: {account || 'Not connected'}</p>
        
        <div className="role-section">
          <button onClick={() => registerAsPatient()}>Register as Patient</button>
          {/* Add more role-specific buttons */}
        </div>
        
        {/* Add more UI components for different functionalities */}
      </header>
    </div>
  );

  async function registerAsPatient() {
    if (!contracts.medicalAccess) return;
    try {
      const tx = await contracts.medicalAccess.registerPatient();
      await tx.wait();
      alert("Successfully registered as patient!");
    } catch (error) {
      console.error("Patient registration failed:", error);
      alert("Registration failed. See console for details.");
    }
  }
}

export default App;