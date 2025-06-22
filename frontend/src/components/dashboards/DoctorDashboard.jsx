import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import {
  DashboardContainer,
  TabContainer,
  TabButton,
  ContentArea,
  HeaderContainer,
  DoctorInfo,
  ActionButton
} from '../styles/DoctorDashboardStyles';
import PatientsTab from '../doctor/PatientsTab';
import PrescriptionsTab from '../doctor/PrescriptionsTab';
import HistoryTab from '../doctor/HistoryTab';
import RefillsTab from '../doctor/RefillsTab';

const DoctorDashboard = () => {
  const { account, role, contract, contracts } = useWallet();
  const [activeTab, setActiveTab] = useState('patients');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const navigate = useNavigate();

  // Load doctor profile data
  useEffect(() => {
    if (!account || role !== 'doctor') {
      navigate('/');
      return;
    }

    const loadDoctorProfile = async () => {
      try {
        const profile = await contracts.medicalAccess.getDoctor(account);
        setDoctorProfile(profile);
      } catch (error) {
        console.error("Failed to load doctor profile:", error);
      }
    };

    loadDoctorProfile();
  }, [account, role, navigate, contracts.medicalAccess]);

  return (
    <DashboardContainer>
      <HeaderContainer>
        <DoctorInfo>
          <h2>Dr. {doctorProfile?.name || 'Loading...'}</h2>
          <p>{doctorProfile?.specialization || 'Specialization'}</p>
        </DoctorInfo>
        
        {activeTab === 'prescriptions' && (
          <ActionButton onClick={() => setShowNewPrescription(true)}>
            + New Prescription
          </ActionButton>
        )}
      </HeaderContainer>

      <TabContainer>
        <TabButton 
          active={activeTab === 'patients'} 
          onClick={() => setActiveTab('patients')}
        >
          My Patients
        </TabButton>
        <TabButton 
          active={activeTab === 'prescriptions'} 
          onClick={() => setActiveTab('prescriptions')}
        >
          Prescriptions
        </TabButton>
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
        >
          History
        </TabButton>
        <TabButton 
          active={activeTab === 'refills'} 
          onClick={() => setActiveTab('refills')}
        >
          Refill Requests
        </TabButton>
      </TabContainer>

      <ContentArea>
        {activeTab === 'patients' && <PatientsTab />}
        {activeTab === 'prescriptions' && (
          <PrescriptionsTab 
            showNewPrescription={showNewPrescription}
            onClose={() => setShowNewPrescription(false)}
          />
        )}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'refills' && <RefillsTab />}
      </ContentArea>
    </DashboardContainer>
  );
};

export default DoctorDashboard;