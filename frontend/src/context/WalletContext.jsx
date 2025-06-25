import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import MedicalAccessABI from '../abi/MedicalAccess.json';
import PrescriptionRegistryABI from '../abi/PrescriptionRegistry.json';
import PrescriptionTokenABI from '../abi/PrescriptionToken.json';

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
  const [contracts, setContracts] = useState({
    medicalAccess: null,
    prescriptionRegistry: null,
    prescriptionToken: null
  });

  const medicalAccessAddress = import.meta.env.VITE_APP_MEDICAL_ACCESS_ADDRESS;
  const prescriptionRegistryAddress = import.meta.env.VITE_APP_PRESCRIPTION_REGISTRY_ADDRESS;
  const prescriptionTokenAddress = import.meta.env.VITE_APP_PRESCRIPTION_TOKEN_ADDRESS;

  const hasRole = useCallback(async (roleName, address) => {
    if (!contracts.medicalAccess || !address) return false;
    try {
      const role = await contracts.medicalAccess[roleName]();
      return await contracts.medicalAccess.hasRole(role, address);
    } catch (err) {
      console.error(`Role check failed for ${roleName}:`, err);
      return false;
    }
  }, [contracts.medicalAccess]);

  // In WalletContext.js
  const storePatientData = useCallback(async (data) => {
    if (!account || !contracts.medicalAccess) {
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
      const tx = await contracts.medicalAccess.storeDataCID(cid, { gasLimit: 500000 });
      const receipt = await tx.wait();
      
      // Verify the CID was stored correctly
      const storedCID = await contracts.medicalAccess.getPatientCID(account);
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
  }, [account, contracts.medicalAccess]);

  const storeToIPFS = async (data) => {
    try {
      // Using Pinata cloud (requires API keys)
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `prescription-${Date.now()}`
          }
        })
      });

      if (!response.ok) throw new Error('Pinata upload failed');
      const result = await response.json();
      return result.IpfsHash; // Returns the IPFS CID
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw error;
    }
  };

  const getFromIPFS = async (cid) => {
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://${cid}.ipfs.dweb.link`
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway);
        if (response.ok) return await response.json();
      } catch (e) {
        console.warn(`Failed with gateway ${gateway}:`, e);
      }
    }
    throw new Error('All IPFS gateways failed');
  };

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

  const initContracts = useCallback(async (provider) => {
    try {
      const signer = await provider.getSigner();
      
      const medicalAccess = new ethers.Contract(
        import.meta.env.VITE_APP_MEDICAL_ACCESS_ADDRESS,
        MedicalAccessABI.abi,
        signer
      );

      const prescriptionRegistry = new ethers.Contract(
        import.meta.env.VITE_APP_PRESCRIPTION_REGISTRY_ADDRESS,
        PrescriptionRegistryABI.abi,
        signer
      );

      const prescriptionToken = new ethers.Contract(
        import.meta.env.VITE_APP_PRESCRIPTION_TOKEN_ADDRESS,
        PrescriptionTokenABI.abi,
        signer
      );

      setContracts({
        medicalAccess,
        prescriptionRegistry,
        prescriptionToken
      });

      // Set default contract for backward compatibility
      setContract(medicalAccess);

      return { medicalAccess, prescriptionRegistry, prescriptionToken };
    } catch (err) {
      console.error("Contract initialization failed:", err);
      throw new Error("Failed to initialize contracts");
    }
  }, []);

  const checkUserRole = useCallback(async (medicalAccessContract, address) => {
    if (!medicalAccessContract) return null;
    
    try {
      const [isAdmin, isDoctor, isPharmacist, isPatient] = await Promise.all([
        medicalAccessContract.hasRole(await medicalAccessContract.ADMIN_ROLE(), address),
        medicalAccessContract.hasRole(await medicalAccessContract.DOCTOR_ROLE(), address),
        medicalAccessContract.hasRole(await medicalAccessContract.PHARMACIST_ROLE(), address),
        medicalAccessContract.hasRole(await medicalAccessContract.PATIENT_ROLE(), address),
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
      if (!contracts.medicalAccess) return false;
      try {
        return await contracts.medicalAccess.hasRole(await contracts.medicalAccess.PATIENT_ROLE(), address);
      } catch (err) {
        console.error("Registration check failed:", err);
        return false;
      }
    }, [contracts.medicalAccess]);

    const getPatientCID = useCallback(async (patientAddress) => {
      if (!contracts.medicalAccess) {
        throw new Error("Contract not connected");
      }
      
      try {
        return await contracts.medicalAccess.getPatientCID(patientAddress);
      } catch (error) {
        console.error('Failed to fetch patient CID:', error);
        throw error;
      }
    }, [contracts.medicalAccess]);

  const checkPatientProfileComplete = useCallback(async (address) => {
    if (!contracts.medicalAccess || !address) return false;

    try {
      // First check if they have the patient role
      const isPatient = await contracts.medicalAccess.hasRole(await contracts.medicalAccess.PATIENT_ROLE(), address);
      if (!isPatient) return false;

      // Then check if they have a CID stored
      const cid = await contracts.medicalAccess.getPatientCID(address);
      return !!cid && cid !== '';
    } catch (err) {
      console.error("Profile check failed:", err);
      return false;
    }
  }, [contracts.medicalAccess]);


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
      const contract = await initContracts(provider);
      const userRole = await checkUserRole(contract.medicalAccess, accounts[0]);
      
      setAccount(accounts[0]);
      setRole(userRole);
      setContract(contract);
      setError(null);
    } catch (error) {
      console.error("Account change error:", error);
      setError(error.message || "Failed to handle account change");
    }
  }, [initContracts, checkUserRole]);


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
    if (!contracts.medicalAccess || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      // Check if already registered
      const isPatient = await contracts.medicalAccess.hasRole(await contracts.medicalAccess.PATIENT_ROLE(), account);
      if (isPatient) {
        return { success: true, isNew: false };
      }

      // Register new patient
      const tx = await contracts.medicalAccess.registerPatient({
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
  }, [contracts.medicalAccess, account]);

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

  const getContract = useCallback((contractName) => {
    if (!contracts[contractName]) {
      throw new Error(`Contract ${contractName} not initialized`);
    }
    return contracts[contractName];
  }, [contracts]);

  const grantTemporaryAccess = useCallback(async (doctorAddress, dataFields, duration) => {
    if (!contracts.medicalAccess || !account) {
      throw new Error("Wallet not connected");
    }
    if (duration === 0) {
      duration = 3155760000
    }
    try {
      const tx = await contracts.medicalAccess.grantTemporaryAccess(
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
  }, [contracts.medicalAccess, account]);

  const extendAccess = useCallback(async (requestId, doctor, additionalDuration) => {
    if (!contracts.medicalAccess || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await contracts.medicalAccess.extendAccess(
        requestId,
        doctor,
        additionalDuration,
        { gasLimit: 500000 }
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Access extension error:', error);
      throw error;
    }
  }, [contracts.medicalAccess, account]);

  const revokeAccessEarly = useCallback(async (requestId, doctor) => {
    if (!contracts.medicalAccess || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await contracts.medicalAccess.revokeAccessEarly(
        requestId,
        doctor,
        { gasLimit: 500000 }
      ); 
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Access revocation error:', error);
      throw error;
    }
  }, [contracts.medicalAccess, account]);

  const getPatientPermissions = useCallback(async () => {
    if (!contracts.medicalAccess || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get raw permissions from contract
      const rawPermissions = await contracts.medicalAccess.getPermissions(account);
      
      // Get doctor details in parallel
      const permissionsWithDetails = await Promise.all(
        rawPermissions.map(async perm => {
          try {
            // Fetch doctor details
            const doctorProfile = await contracts.medicalAccess.getDoctor(perm.doctor);
            
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
  }, [contracts.medicalAccess, account]);

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
          const { medicalAccess } = await initContracts(provider);
          const userRole = await checkUserRole(medicalAccess, accounts[0]);
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
  }, [initContracts, checkUserRole, handleAccountsChanged]);

  const value = {
    account,
    role,
    loading,
    isConnecting,
    error,
    shouldLogout,
    contracts,
    contract,
    getContract,
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
    getPatientPermissions,
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