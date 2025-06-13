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

  // In WalletContext.js
  const storePatientData = useCallback(async (data) => {
    if (!account || !contract) {
      throw new Error("Wallet not connected");
    }

    try {
      // First try Pinata cloud
      let cid;
      try {
        const pinataResponse = await fetch(
          'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
            },
            body: JSON.stringify({
              pinataContent: data,
              pinataMetadata: {
                name: `patient-data-${account}-${Date.now()}`
              }
            })
          }
        );

        if (!pinataResponse.ok) {
          const errorData = await pinataResponse.json();
          throw new Error(errorData.error?.details || 'IPFS upload failed');
        }

        const result = await pinataResponse.json();
        cid = result.IpfsHash;
      } catch (pinataError) {
        console.warn('Pinata upload failed, trying local IPFS node:', pinataError);
        
        // Fallback to local IPFS node or alternative service
        const localResponse = await fetch('http://localhost:5001/api/v0/add', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!localResponse.ok) throw new Error('Local IPFS upload failed');
        const localResult = await localResponse.json();
        cid = localResult.Hash;
      }

      // Store CID on blockchain
      const tx = await contract.storeDataCID(cid, { gasLimit: 500000 });
      const receipt = await tx.wait();
      
      // Verify the CID was stored correctly
      const storedCID = await contract.getPatientCID(account);
      if (storedCID !== cid) {
        throw new Error('CID verification failed');
      }

      return cid;
    } catch (error) {
      console.error('Data storage failed:', {
        error: error.message,
        stack: error.stack,
        account,
        data
      });
      throw new Error(`Failed to store data: ${error.message}`);
    }
  }, [account, contract]);

  const getPatientData = useCallback(async (cid) => {
    if (!cid) return null;

    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://${cid}.ipfs.dweb.link`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn(`Failed with gateway ${gateway}:`, e);
      }
    }
    throw new Error('All IPFS gateways failed');
  }, []);

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

    const getPatientCID = useCallback(async (patientAddress) => {
      if (!contract) {
        throw new Error("Contract not connected");
      }
      
      try {
        return await contract.getPatientCID(patientAddress);
      } catch (error) {
        console.error('Failed to fetch patient CID:', error);
        throw error;
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

  const grantTemporaryAccess = useCallback(async (doctorAddress, dataFields, duration) => {
    if (!contract || !account) {
      throw new Error("Wallet not connected");
    }
    if (duration === 0) {
      duration = 3155760000
    }
    try {
      const tx = await contract.grantTemporaryAccess(
        doctorAddress,
        dataFields,
        duration,
        { gasLimit: 500000 }
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Access grant error:', error);
      throw error;
    }
  }, [contract, account]);

  const extendAccess = useCallback(async (requestId, additionalDuration) => {
    if (!contract || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await contract.extendAccess(
        requestId,
        additionalDuration,
        { gasLimit: 500000 }
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Access extension error:', error);
      throw error;
    }
  }, [contract, account]);

  const revokeAccessEarly = useCallback(async (requestId) => {
    if (!contract || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await contract.revokeAccessEarly(
        requestId,
        { gasLimit: 500000 }
      ); 
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Access revocation error:', error);
      throw error;
    }
  }, [contract, account]);

  const getActivePermissions = useCallback(async () => {
    if (!contract || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get raw permissions from contract
      const rawPermissions = await contract.getActivePermissions(account);
      
      // Get doctor details in parallel
      const permissionsWithDetails = await Promise.all(
        rawPermissions.map(async perm => {
          try {
            // Fetch doctor details
            console.log(perm);
            const doctorProfile = await contract.getDoctor(perm.doctor);
            
            return {
              requestId: perm.requestId.toString(),
              doctor: perm.doctor,
              patient: perm.patient,
              expiryTime: Number(perm.expiryTime),
              dataFields: perm.dataFields,
              isActive: perm.isActive,
              doctorName: doctorProfile.name || 'Unknown Doctor',
              doctorSpecialization: doctorProfile.specialization || '',
              hospital: perm.hospital || ''
            };
          } catch (err) {
            console.error(`Failed to fetch doctor ${perm.doctor}:`, err);
            return {
              ...perm,
              doctorName: 'Unknown Doctor',
              doctorSpecialization: '',
              hospital: ''
            };
          }
        })
      );

      return permissionsWithDetails;
    } catch (error) {
      console.error('Permission fetch error:', error);
      throw error;
    }
  }, [contract, account]);

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
    getPatientCID,
    hasRole,
    grantTemporaryAccess,
    extendAccess,
    revokeAccessEarly,
    getActivePermissions,
    getPatientData
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