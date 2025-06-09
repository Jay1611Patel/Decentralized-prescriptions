import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PatientHeader from '../patient/PatientHeader';
import PermissionRequest from '../patient/PermissionRequest';
import ActivePermissions from '../patient/ActivePermissions';
import PrescriptionList from '../patient/PrescriptionList';

const PatientDashboard = () => {
  const { account, role, contract } = useWallet();
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
    if (!contract) return;
    try {
      const perms = await contract.getActivePermissions(account);
      setPermissions(perms);
    } catch (error) {
      console.error("Failed to load permissions:", error);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [contract, account]);

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
      </ContentArea>

      {showPermissionRequest && (
        <PermissionRequest 
          onClose={() => setShowPermissionRequest(false)}
          onComplete={loadPermissions}
        />
      )}
    </DashboardContainer>
  );
}

export default PermissionRequest;