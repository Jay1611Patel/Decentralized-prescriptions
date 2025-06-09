import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import { FaUserInjured, FaPrescriptionBottleAlt, FaHistory, FaRedoAlt, FaCog } from 'react-icons/fa';
import PatientManagement from '../doctor/PatientManagement';
import PrescriptionCreation from '../doctor/PrescriptionCreation';
import PrescriptionHistory from '../doctor/PrescriptionHistory';
import RefillRequests from '../doctor/RefillRequests';
import DoctorSettings from '../doctor/DoctorSettings';

const DoctorDashboard = () => {
  const { account, role, loading, contract } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patients');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!account) {
      navigate('/');
    } 
  }, [account, role, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!contract || !account) return;

      try {
        const profile = await contract.getDoctor(account);
        setDoctorProfile(profile);
      } catch (error) {
        console.error("Failed to load doctor profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [contract, account]);

  if (loading || loadingProfile) {
    return (
      <DashboardContainer>
        <LoadingMessage>Loading dashboard...</LoadingMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Sidebar>
        <ProfileSection>
          <DoctorAvatar>
            {doctorProfile?.name?.charAt(0) || 'D'}
          </DoctorAvatar>
          <DoctorInfo>
            <DoctorName>{doctorProfile?.name || 'Doctor'}</DoctorName>
            <DoctorSpecialty>{doctorProfile?.specialization || 'General Practitioner'}</DoctorSpecialty>
            <LicenseStatus>
              License: {doctorProfile?.expiryDate > Math.floor(Date.now() / 1000) ? 'Active' : 'Expired'}
            </LicenseStatus>
          </DoctorInfo>
        </ProfileSection>

        <NavMenu>
          <NavItem active={activeTab === 'patients'} 
          onClick={() => setActiveTab('patients')}>
            <FaUserInjured /> Patients
          </NavItem>
          <NavItem 
            active={activeTab === 'prescriptions'} 
            onClick={() => setActiveTab('prescriptions')}
          >
            <FaPrescriptionBottleAlt /> Prescriptions
          </NavItem>
          <NavItem 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          >
            <FaHistory /> History
          </NavItem>
          <NavItem 
            active={activeTab === 'refills'} 
            onClick={() => setActiveTab('refills')}
          >
            <FaRedoAlt /> Refills
          </NavItem>
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Settings
          </NavItem>
        </NavMenu>
      </Sidebar>
      <MainContent>
        {activeTab === 'patients' && <PatientManagement />}
        {activeTab === 'prescriptions' && <PrescriptionCreation />}
        {activeTab === 'history' && <PrescriptionHistory />}
        {activeTab === 'refills' && <RefillRequests />}
        {activeTab === 'settings' && <DoctorSettings profile={doctorProfile} />}
      </MainContent>
    </DashboardContainer>
  );
};

export default DoctorDashboard;

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const Sidebar = styled.div`
  width: 250px;
  background: #2c3e50;
  color: white;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 20px;
`;

const DoctorAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 15px;
`;

const DoctorInfo = styled.div`
  text-align: center;
`;

const DoctorName = styled.h3`
  margin: 0;
  font-size: 18px;
`;

const DoctorSpecialty = styled.p`
  margin: 5px 0;
  font-size: 14px;
  opacity: 0.8;
`;

const LicenseStatus = styled.p`
  margin: 5px 0;
  font-size: 12px;
  color: #2ecc71;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
`;

const NavItem = styled.div`
  padding: 15px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  background: ${props => props.active ? '#34495e' : 'transparent'};
  border-left: ${props => props.active ? '4px solid #3498db' : 'none'};
  
  &:hover {
    background: #34495e;
  }
  
  svg {
    margin-right: 10px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #555;
`;