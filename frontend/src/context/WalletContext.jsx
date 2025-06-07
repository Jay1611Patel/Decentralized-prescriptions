import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import MedicalAccessABI from '../abi/MedicalAccess.json';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [shouldLogout, setShouldLogout] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const navigate = useNavigate();

  const contractAddress = import.meta.env.VITE_APP_MEDICAL_ACCESS_ADDRESS;

  const hasRole = useCallback(async (roleName, address) => {
    if (!contract || !address) return false;
    try {
      const role = await contract[roleName]();
      return await contract.hasRole(role, address);
    } catch (err) {
      console.error(`Role check failed for ${roleName}:`, err);
      return false;
    }
  }, [contract]);

  const storePatientData = useCallback(async (data) => {
    if (!account || !contract) {
      throw new Error("Wallet not connected");
    }

    try {
      // Upload to IPFS
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `patient-data-${account}`
          }
        })
      });

      if (!response.ok) throw new Error('IPFS upload failed');
      const { IpfsHash: cid } = await response.json();

      // Store CID on blockchain
      const tx = await contract.storeDataCID(cid);
      await tx.wait(); // Wait for transaction to be mined

      return true;
    } catch (error) {
      console.error('Data storage failed:', error);
      throw new Error('Failed to store patient data');
    }
  }, [account, contract]);

  const initContract = useCallback(async (provider) => {
    if (!contractAddress) {
      throw new Error("Contract address not configured");
    }

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        MedicalAccessABI.abi,
        signer
      );
      setContract(contract);
      return contract;
    } catch (err) {
      console.error("Contract initialization failed:", err);
      throw new Error("Failed to initialize contract");
    }
  }, [contractAddress]);

  const checkUserRole = useCallback(async (contract, address) => {
    if (!contract) return null;
    
    try {
      const [isAdmin, isDoctor, isPharmacist, isPatient] = await Promise.all([
        contract.hasRole(await contract.ADMIN_ROLE(), address),
        contract.hasRole(await contract.DOCTOR_ROLE(), address),
        contract.hasRole(await contract.PHARMACIST_ROLE(), address),
        contract.hasRole(await contract.PATIENT_ROLE(), address),
      ]);

      if (isAdmin) return 'admin';
      if (isDoctor) return 'doctor';
      if (isPharmacist) return 'pharmacist';
      if (isPatient) return 'patient';
      return null;
    } catch (err) {
      console.error("Role check error:", err);
      return null;
    }
  }, []);

  const checkPatientRegistration = useCallback(async (address) => {
      if (!contract) return false;
      try {
        return await contract.hasRole(await contract.PATIENT_ROLE(), address);
      } catch (err) {
        console.error("Registration check failed:", err);
        return false;
      }
    }, [contract]);

  const checkPatientProfileComplete = useCallback(async (address) => {
    if (!contract || !address) return false;

    try {
      // First check if they have the patient role
      const isPatient = await contract.hasRole(await contract.PATIENT_ROLE(), address);
      if (!isPatient) return false;

      // Then check if they have a CID stored
      const cid = await contract.getPatientCID(address);
      return !!cid && cid !== '';
    } catch (err) {
      console.error("Profile check failed:", err);
      return false;
    }
  }, [contract]);

  const handleAccountsChanged = useCallback(async (accounts) => {
  try {
    if (accounts.length === 0) {
      // Wallet disconnected
      setAccount(null);
      setRole(null);
      setContract(null);
      setIsDisconnected(true);
      return;
    }

    // Wallet connected or account changed
    setIsDisconnected(false);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = await initContract(provider);
    const userRole = await checkUserRole(contract, accounts[0]);
    
    setAccount(accounts[0]);
    setRole(userRole);
    setContract(contract);
    setError(null);
  } catch (error) {
    console.error("Account change error:", error);
    setError(error.message || "Failed to handle account change");
  }
}, [initContract, checkUserRole]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      await handleAccountsChanged(accounts);
    } catch (err) {
      if (err.code === 4001) {
        setError('Please connect your wallet to continue');
      } else {
        setError(err.message || 'Connection failed');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged]);

  const registerAsPatient = useCallback(async () => {
    if (!contract || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      // Check if already registered
      const isPatient = await contract.hasRole(await contract.PATIENT_ROLE(), account);
      if (isPatient) {
        return { success: true, isNew: false };
      }

      // Register new patient
      const tx = await contract.registerPatient({
        gasLimit: 500000
      });
      await tx.wait();

      // Update role state
      setRole('patient');

      return { success: true, isNew: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [contract, account]);

  const parseRegistrationError = (error) => {
    if (error.code === 4001) {
      return new Error('Transaction was cancelled');
    }
    if (error.message.includes('insufficient funds')) {
      return new Error('Insufficient ETH for transaction fees');
    }
    if (error.message.includes('execution reverted')) {
      return new Error('Contract rejected the transaction');
    }
    return new Error('Registration failed. Please try again.');
  };

  useEffect(() => {
    if (!window.ethereum) {
      setLoading(false);
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    const checkInitialConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const contract = await initContract(provider);
          const userRole = await checkUserRole(contract, accounts[0]);
          setAccount(accounts[0]);
          setRole(userRole);
        }
      } catch (err) {
        console.error("Initial connection error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkInitialConnection();

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [initContract, checkUserRole, handleAccountsChanged]);

  const value = {
    account,
    role,
    loading,
    isConnecting,
    error,
    shouldLogout,
    contract,
    connectWallet,
    isMetaMaskInstalled: !!window.ethereum,
    registerAsPatient,
    checkPatientRegistration,
    checkPatientProfileComplete,
    parseRegistrationError,
    storePatientData,
    hasRole
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};