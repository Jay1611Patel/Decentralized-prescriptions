// components/PatientDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import {
  DashboardContainer,
  TabContainer,
  TabButton,
  ContentArea,
  ActionButton
} from '../styles/PatientDashboardStyles';
import PatientHeader from '../patient/PatientHeader';
import PermissionRequest from '../patient/PermissionRequest';
import ActivePermissions from '../patient/ActivePermissions';
import PrescriptionList from '../patient/PrescriptionList';
import PatientProfileTab from '../patient/PatientProfileTab';

const PatientDashboard = () => {
  const { account, role, contract, contracts, getPatientCID } = useWallet();
  const [activeTab, setActiveTab] = useState('permissions');
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!account || role !== 'patient') {
      navigate('/');
    }
  }, [account, role, navigate]);

  const loadPermissions = async () => {
    if (!contracts.medicalAccess) return;
    try {
      const perms = await contracts.medicalAccess.getPatientPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error("Failed to load permissions:", error);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [contracts.medicalAccess, account]);

  return (
    <DashboardContainer>
      <PatientHeader 
        onRequestAccess={() => setShowPermissionRequest(true)}
      />
      
      <TabContainer>
        <TabButton 
          active={activeTab === 'permissions'} 
          onClick={() => setActiveTab('permissions')}
        >
          Access Permissions
        </TabButton>
        <TabButton 
          active={activeTab === 'prescriptions'} 
          onClick={() => setActiveTab('prescriptions')}
        >
          My Prescriptions
        </TabButton>
        <TabButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </TabButton>
      </TabContainer>

      <ContentArea>
        {activeTab === 'permissions' && (
          <>
            <ActivePermissions 
              permissions={permissions} 
              onRevoke={loadPermissions}
              onExtend={loadPermissions}
            />
            <ActionButton onClick={() => setShowPermissionRequest(true)}>
              + Grant New Access
            </ActionButton>
          </>
        )}
        
        {activeTab === 'prescriptions' && (
          <PrescriptionList />
        )}
        {activeTab === 'profile' && <PatientProfileTab />}
      </ContentArea>

      {showPermissionRequest && (
        <PermissionRequest 
          onClose={() => setShowPermissionRequest(false)}
          onComplete={loadPermissions}
        />
      )}
    </DashboardContainer>
  );
};

export default PatientDashboard;