// src/components/dashboards/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { FaPlus, FaUserMd, FaUserInjured, FaPills, FaUserShield, FaTable, FaPrescription, FaHistory, FaTachometerAlt } from 'react-icons/fa';
import Modal from 'react-modal';
import MedicalAccessABI from '../../abi/MedicalAccess.json';
import PrescriptionRegistryABI from '../../abi/PrescriptionRegistry.json';

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  width: 100vw; // Add this
  margin: 0; // Add this
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px 0;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  width: calc(100vw - 250px);
`;

const SidebarItem = styled.div`
  padding: 15px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-left: 4px solid transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background-color: #34495e;
  }
  
  ${({ active }) => active && `
    background-color: #34495e;
    border-left: 4px solid #3498db;
  `}
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 10px;
  text-align: center;
  flex: 1;
  min-width: 200px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
  margin: 10px 0;
`;

const StatLabel = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const StatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: -10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  background-color:#3498db;
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
  
  &:hover {
    background-color: #f1f1f1;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #e0e0e0;
  color: rgb(51, 51, 51);
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#3498db' : '#e74c3c'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: ${props => props.primary ? '#2980b9' : '#c0392b'};
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const FloatingActionButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.3s;

  &:hover {
    background-color: #2980b9;
    transform: scale(1.1);
  }
`;

const UserTypeTabs = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
`;

const UserTypeTab = styled.button`
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ active }) => active && `
    color: #3498db;
    border-bottom-color: #3498db;
  `}
`;

const UserModal = styled(Modal)`
  position: absolute;
  top: 50%;
  left: 50%;
  right: auto;
  bottom: auto;
  margin-right: -50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.active ? '#2ecc71' : '#e74c3c'};
  color: white;
`;

// Constants
const USER_TYPES = {
  DOCTOR: 'doctor',
  PHARMACIST: 'pharmacist',
  PATIENT: 'patient'
};

const AdminDashboard = () => {
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeUserType, setActiveUserType] = useState(USER_TYPES.DOCTOR);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Data states
  const [doctors, setDoctors] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    activeUsers: 0,
    doctorsCount: 0,
    pharmacistsCount: 0,
    patientsCount: 0
  });
  const [revokedUsers, setRevokedUsers] = useState({
    doctors: [],
    pharmacists: [],
    patients: []
  });
  // Form states
  const [newUser, setNewUser] = useState({
    type: USER_TYPES.DOCTOR,
    address: '',
    licenseHash: '',
    expiryDate: '',
    name: '',
    specialization: '',
    pharmacyId: '',
    pharmacyName: ''
  });

  // Contract instances
  const [medicalAccessContract, setMedicalAccessContract] = useState(null);
  const [prescriptionRegistryContract, setPrescriptionRegistryContract] = useState(null);

  // Initialize contracts
  useEffect(() => {
    const initContracts = async () => {
      if (!account) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Initialize MedicalAccess contract
        const medicalAccessAddress = import.meta.env.VITE_APP_MEDICAL_ACCESS_ADDRESS;
        const medicalAccess = new ethers.Contract(
          medicalAccessAddress,
          MedicalAccessABI.abi,
          signer
        );
        setMedicalAccessContract(medicalAccess);

        // Initialize PrescriptionRegistry contract if address is available
        const prescriptionRegistryAddress = import.meta.env.VITE_APP_PRESCRIPTION_REGISTRY_ADDRESS;
        if (prescriptionRegistryAddress) {
          const prescriptionRegistry = new ethers.Contract(
            prescriptionRegistryAddress,
            PrescriptionRegistryABI.abi,
            signer
          );
          setPrescriptionRegistryContract(prescriptionRegistry);
        }
        
        // Load initial data
        loadData(medicalAccess);
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    };
    
    initContracts();
  }, [account]);

  // Load all necessary data
  const loadData = async (medicalAccess) => {
  try {
    setLoading(true);
    
    // Load doctors with active status check
    const doctorAddresses = await medicalAccess.getAllDoctors();
    const doctorPromises = doctorAddresses.map(async addr => {
      const profile = await medicalAccess.getDoctor(addr);
      const isActive = await medicalAccess.isActive(addr);
      return { 
        address: addr,
        ...profile,
        isActive 
      };
    });
    const doctorResults = await Promise.all(doctorPromises);
    setDoctors(doctorResults);
    
    // Load pharmacists with verification check
    const pharmacistAddresses = await medicalAccess.getAllPharmacists();
    const pharmacistPromises = pharmacistAddresses.map(async addr => {
      const profile = await medicalAccess.getPharmacist(addr);
      const isVerified = await medicalAccess.isVerifiedPharmacist(addr);
      return {
        address: addr,
        ...profile,
        isVerified
      };
    });
    const pharmacistResults = await Promise.all(pharmacistPromises);
    setPharmacists(pharmacistResults);
    
    // Load patients with role check
    const patientFilter = medicalAccess.filters.PatientRegistered();
    const patientEvents = await medicalAccess.queryFilter(patientFilter);
    const patientRevokedFilter = medicalAccess.filters.RoleRevoked(
      await medicalAccess.PATIENT_ROLE()
    );
    const revokedPatientEvents = await medicalAccess.queryFilter(patientRevokedFilter);
    
    const revokedPatients = new Set(revokedPatientEvents.map(e => e.args.account));
    const activePatients = patientEvents
      .filter(e => !revokedPatients.has(e.args.account))
      .map(e => ({ address: e.args.account }));
    
    setPatients(activePatients);
    
    // Update stats
    setStats({
      doctorsCount: doctorResults.filter(d => d.isActive).length,
      pharmacistsCount: pharmacistResults.filter(p => p.isVerified).length,
      patientsCount: activePatients.length,
      totalPrescriptions: 0, // From prescription registry
      activeUsers: doctorResults.filter(d => d.isActive).length + 
                 pharmacistResults.filter(p => p.isVerified).length + 
                 activePatients.length
    });
    
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    setLoading(false);
  }
};

  // Register a new doctor
  const handleRegisterDoctor = async () => {
    try {
      if (!medicalAccessContract) return;
      
      const tx = await medicalAccessContract.registerDoctor(
        newUser.address,
        newUser.licenseHash,
        Math.floor(new Date(newUser.expiryDate).getTime() / 1000),
        newUser.name,
        newUser.specialization
      );
      
      await tx.wait();
      await loadData(medicalAccessContract);
      
      // Reset form
      setNewUser({
        ...newUser,
        address: '',
        licenseHash: '',
        expiryDate: '',
        name: '',
        specialization: ''
      });
      
      alert('Doctor registered successfully!');
    } catch (error) {
      console.error("Error registering doctor:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Register a new pharmacist
  const handleRegisterPharmacist = async () => {
    try {
      if (!medicalAccessContract) return;
      
      const tx = await medicalAccessContract.registerPharmacist(
        newUser.address,
        newUser.pharmacyId,
        newUser.pharmacyName
      );
      
      await tx.wait();
      await loadData(medicalAccessContract);
      
      // Reset form
      setNewUser({
        ...newUser,
        address: '',
        pharmacyId: '',
        pharmacyName: ''
      });
      
      alert('Pharmacist registered successfully!');
    } catch (error) {
      console.error("Error registering pharmacist:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle creating any type of user
  const handleCreateUser = async () => {
    try {
      if (activeUserType === USER_TYPES.DOCTOR) {
        await handleRegisterDoctor();
      } else if (activeUserType === USER_TYPES.PHARMACIST) {
        await handleRegisterPharmacist();
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  // Handle revoking any type of user
  const handleRevokeUser = async (address, userType) => {
  if (!window.confirm(`Are you sure you want to revoke this ${userType}?`)) return;
  
  try {
    if (userType === USER_TYPES.DOCTOR) {
      await medicalAccessContract.revokeDoctor(address);
      setDoctors(prev => prev.map(d => 
        d.address === address ? { ...d, isActive: false } : d
      ));
    } 
    else if (userType === USER_TYPES.PHARMACIST) {
      await medicalAccessContract.revokePharmacist(address);
      setPharmacists(prev => prev.map(p => 
        p.address === address ? { ...p, isVerified: false } : p
      ));
    } 
    else if (userType === USER_TYPES.PATIENT) {
      await medicalAccessContract.revokeRole(
        await medicalAccessContract.PATIENT_ROLE(),
        address
      );
      setPatients(prev => prev.filter(p => p.address !== address));
    }

    // Update stats
    setStats(prev => ({
      ...prev,
      activeUsers: prev.activeUsers - 1,
      ...(userType === USER_TYPES.DOCTOR && { doctorsCount: prev.doctorsCount - 1 }),
      ...(userType === USER_TYPES.PHARMACIST && { pharmacistsCount: prev.pharmacistsCount - 1 }),
      ...(userType === USER_TYPES.PATIENT && { patientsCount: prev.patientsCount - 1 }),
    }));

    alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} revoked successfully!`);
  } catch (error) {
    console.error(`Error revoking ${userType}:`, error);
    alert(`Error: ${error.message}`);
  }
};

  // Toggle emergency pause
  const handleTogglePause = async (hours) => {
    try {
      const tx = await medicalAccessContract.togglePause(hours);
      await tx.wait();
      alert(`System ${await medicalAccessContract.emergencyPause() ? 'paused' : 'unpaused'} successfully!`);
    } catch (error) {
      console.error("Error toggling pause:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Render user management section
  const renderUserManagement = () => {
    const currentUsers = activeUserType === USER_TYPES.DOCTOR 
      ? doctors 
      : activeUserType === USER_TYPES.PHARMACIST 
        ? pharmacists 
        : patients;

    const columns = activeUserType === USER_TYPES.DOCTOR ? [
      { 
        header: 'Address', 
        accessor: 'address',
        format: (value = '') => value // Provide default empty string if undefined
      },
      { 
        header: 'Name', 
        accessor: 'name',
        format: (value = '') => value || 'N/A' // Handle undefined name
      },
      { 
        header: 'Specialization', 
        accessor: 'specialization',
        format: (value = '') => value || 'N/A' // Handle undefined specialization
      },
      { 
        header: 'License Expiry', 
        accessor: 'expiryDate', 
        format: (value) => value ? new Date(value * 1000).toLocaleDateString() : 'N/A'
      },
      { 
        header: 'Status', 
        accessor: 'isActive', 
        format: (value = false) => <StatusBadge active={value}>{value ? 'Active' : 'Revoked'}</StatusBadge>
      }
    ] : activeUserType === USER_TYPES.PHARMACIST ? [
      { 
        header: 'Address', 
        accessor: 'address',
        format: (value = '') => value
      },
      { 
        header: 'Pharmacy Name', 
        accessor: 'pharmacyName',
        format: (value = '') => value || 'N/A'
      },
      { 
        header: 'Pharmacy ID', 
        accessor: 'pharmacyId',
        format: (value = '') => value || 'N/A'
      },
      { 
        header: 'Status', 
        accessor: 'isVerified', 
        format: (value = false) => <StatusBadge active={value}>{value ? 'Verified' : 'Revoked'}</StatusBadge>
      }
    ] : [
      { 
        header: 'Address', 
        accessor: 'address',
        format: (value = '') => value
      },
      { 
        header: 'Status', 
        accessor: 'address', 
        format: () => <StatusBadge active={true}>Active</StatusBadge>
      }
    ];

    return (
      <>
        <SectionTitle>
          {activeUserType === USER_TYPES.DOCTOR && <><FaUserMd /> Doctor Management</>}
          {activeUserType === USER_TYPES.PHARMACIST && <><FaPills /> Pharmacist Management</>}
          {activeUserType === USER_TYPES.PATIENT && <><FaUserInjured /> Patient Management</>}
        </SectionTitle>
        
        <UserTypeTabs>
          <UserTypeTab 
            active={activeUserType === USER_TYPES.DOCTOR}
            onClick={() => setActiveUserType(USER_TYPES.DOCTOR)}
          >
            <FaUserMd /> Doctors ({doctors.length})
          </UserTypeTab>
          <UserTypeTab 
            active={activeUserType === USER_TYPES.PHARMACIST}
            onClick={() => setActiveUserType(USER_TYPES.PHARMACIST)}
          >
            <FaPills /> Pharmacists ({pharmacists.length})
          </UserTypeTab>
          <UserTypeTab 
            active={activeUserType === USER_TYPES.PATIENT}
            onClick={() => setActiveUserType(USER_TYPES.PATIENT)}
          >
            <FaUserInjured /> Patients ({patients.length})
          </UserTypeTab>
        </UserTypeTabs>
        
        <Card>
          <Table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <TableHeader key={col.accessor}>{col.header}</TableHeader>
                ))}
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.filter(user => {
                  if (activeUserType === USER_TYPES.DOCTOR) return user.isActive;
                  if (activeUserType === USER_TYPES.PHARMACIST) return user.isVerified;
                  return true; // Patients are already filtered in loadData
                }).map((user) => (
                  <TableRow 
                    key={user.address}
                    style={{
                      // Optional: Gray out revoked users
                      opacity: (
                        (activeUserType === USER_TYPES.DOCTOR && !user.isActive) ||
                        (activeUserType === USER_TYPES.PHARMACIST && !user.isVerified)
                      ) ? 0.6 : 1
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell key={`${user.address}-${col.accessor}`}>
                        {col.format 
                          ? col.format(user[col.accessor]) 
                          : user[col.accessor]
                        }
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button 
                        onClick={() => handleRevokeUser(user.address, activeUserType)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} style={{ textAlign: 'center' }}>
                    No {activeUserType}s found
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </Card>

        {activeUserType !== USER_TYPES.PATIENT && (
          <FloatingActionButton 
            onClick={() => {
              setNewUser({
                ...newUser,
                type: activeUserType,
                address: '',
                licenseHash: '',
                expiryDate: '',
                name: '',
                specialization: '',
                pharmacyId: '',
                pharmacyName: ''
              });
              setIsCreateModalOpen(true);
            }}
            title={`Create ${activeUserType.charAt(0).toUpperCase() + activeUserType.slice(1)}`}
          >
            <FaPlus />
          </FloatingActionButton>
        )}

        <UserModal
          isOpen={isCreateModalOpen}
          onRequestClose={() => setIsCreateModalOpen(false)}
          contentLabel="Create User Modal"
          ariaHideApp={false}
        >
          <CloseButton onClick={() => setIsCreateModalOpen(false)}>
            &times;
          </CloseButton>
          
          <ModalTitle>
            {activeUserType === USER_TYPES.DOCTOR && <><FaUserMd /> Register Doctor</>}
            {activeUserType === USER_TYPES.PHARMACIST && <><FaPills /> Register Pharmacist</>}
          </ModalTitle>

          <FormGroup>
            <FormLabel>Wallet Address</FormLabel>
            <FormInput 
              type="text" 
              value={newUser.address}
              onChange={(e) => setNewUser({...newUser, address: e.target.value})}
              placeholder="0x..."
            />
          </FormGroup>

          {activeUserType === USER_TYPES.DOCTOR && (
            <>
              <FormGroup>
                <FormLabel>Name</FormLabel>
                <FormInput 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Dr. John Doe"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Specialization</FormLabel>
                <FormInput 
                  type="text" 
                  value={newUser.specialization}
                  onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                  placeholder="Cardiology"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>License Hash (IPFS)</FormLabel>
                <FormInput 
                  type="text" 
                  value={newUser.licenseHash}
                  onChange={(e) => setNewUser({...newUser, licenseHash: e.target.value})}
                  placeholder="Qm..."
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>License Expiry Date</FormLabel>
                <FormInput 
                  type="date" 
                  value={newUser.expiryDate}
                  onChange={(e) => setNewUser({...newUser, expiryDate: e.target.value})}
                />
              </FormGroup>
            </>
          )}

          {activeUserType === USER_TYPES.PHARMACIST && (
            <>
              <FormGroup>
                <FormLabel>Pharmacy Name</FormLabel>
                <FormInput 
                  type="text" 
                  value={newUser.pharmacyName}
                  onChange={(e) => setNewUser({...newUser, pharmacyName: e.target.value})}
                  placeholder="City Pharmacy"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Pharmacy ID</FormLabel>
                <FormInput 
                  type="text" 
                  value={newUser.pharmacyId}
                  onChange={(e) => setNewUser({...newUser, pharmacyId: e.target.value})}
                  placeholder="License number"
                />
              </FormGroup>
            </>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <Button 
              onClick={() => handleCreateUser()}
              primary
              disabled={
                !newUser.address || 
                (activeUserType === USER_TYPES.DOCTOR && 
                  (!newUser.name || !newUser.specialization || !newUser.licenseHash || !newUser.expiryDate)) ||
                (activeUserType === USER_TYPES.PHARMACIST && 
                  (!newUser.pharmacyName || !newUser.pharmacyId))
              }
            >
              Create {activeUserType.charAt(0).toUpperCase() + activeUserType.slice(1)}
            </Button>
            <Button onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </UserModal>
      </>
    );
  };

  // Render dashboard content based on active tab
  const renderContent = () => {
    if (loading) {
      return <div>Loading data...</div>;
    }
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <SectionTitle><FaTachometerAlt /> System Overview</SectionTitle>
            <StatsContainer>
              <StatCard>
                <StatLabel>Total Prescriptions</StatLabel>
                <StatValue>{stats.totalPrescriptions}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Active Users</StatLabel>
                <StatValue>{stats.activeUsers}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Doctors</StatLabel>
                <StatValue>{stats.doctorsCount}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Pharmacists</StatLabel>
                <StatValue>{stats.pharmacistsCount}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Patients</StatLabel>
                <StatValue>{stats.patientsCount}</StatValue>
              </StatCard>
            </StatsContainer>
            
            <SectionTitle><FaUserShield /> System Controls</SectionTitle>
            <Card>
              <Button 
                onClick={() => handleTogglePause(24)}
                primary
              >
                {medicalAccessContract?.emergencyPause ? 'Unpause System' : 'Pause System (24h)'}
              </Button>
            </Card>
          </>
        );
      
      case 'users':
        return renderUserManagement();
      
      case 'prescriptions':
        return (
          <>
            <SectionTitle><FaPrescription /> Prescription Management</SectionTitle>
            <Card>
              <p>Prescription management features will be implemented here.</p>
            </Card>
          </>
        );
      
      case 'logs':
        return (
          <>
            <SectionTitle><FaHistory /> System Logs</SectionTitle>
            <Card>
              <p>System logs will be displayed here.</p>
            </Card>
          </>
        );
      
      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <DashboardContainer>
      <Sidebar>
        <SidebarItem 
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaTachometerAlt /> Dashboard
        </SidebarItem>
        <SidebarItem 
          active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
        >
          <FaUserShield /> Users
        </SidebarItem>
        <SidebarItem 
          active={activeTab === 'prescriptions'}
          onClick={() => setActiveTab('prescriptions')}
        >
          <FaPrescription /> Prescriptions
        </SidebarItem>
        <SidebarItem 
          active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
        >
          <FaHistory /> System Logs
        </SidebarItem>
      </Sidebar>
      
      <MainContent>
        {renderContent()}
      </MainContent>
    </DashboardContainer>
  );
};

export default AdminDashboard;