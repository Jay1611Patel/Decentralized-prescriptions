import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
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

  const contractAddress = import.meta.env.VITE_APP_MEDICAL_ACCESS_ADDRESS;

  const initContract = useCallback(async (provider) => {
    if (!contractAddress) {
      throw new Error("Contract address not configured");
    }

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress,
      MedicalAccessABI.abi,
      signer
    );
    setContract(contract);
    return contract;
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

  // Handle account changes (disconnections/switches)
  const handleAccountsChanged = useCallback(async (accounts) => {
    if (accounts.length === 0) {
      // Account disconnected
      setAccount(null);
      setRole(null);
      setContract(null);
      setShouldLogout(true); // Trigger logout
    } else {
      // Account connected or switched
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = await initContract(provider);
      const userRole = await checkUserRole(contract, accounts[0]);
      
      setAccount(accounts[0]);
      setRole(userRole);
      setShouldLogout(false);
    }
  }, [initContract, checkUserRole]);

  // Set up event listeners
  useEffect(() => {
    if (!window.ethereum) {
      setLoading(false);
      return;
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Check initial connection
    const checkInitialConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = await initContract(provider);
          const userRole = await checkUserRole(contract, accounts[0]);
          
          setAccount(accounts[0]);
          setRole(userRole);
        }
      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkInitialConnection();

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [handleAccountsChanged, initContract, checkUserRole]);

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
      handleAccountsChanged(accounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged]);

  const value = {
    account,
    role,
    loading,
    isConnecting,
    error,
    shouldLogout, // Add this to context
    connectWallet,
    isMetaMaskInstalled: !!window.ethereum,
    registerAsPatient: async () => {
      if (!contract || !account) return false;
      try {
        const tx = await contract.registerPatient();
        await tx.wait();
        const newRole = await checkUserRole(contract, account);
        setRole(newRole);
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    }
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