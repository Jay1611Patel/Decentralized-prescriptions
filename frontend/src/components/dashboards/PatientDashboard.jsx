import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #2d3748;
`;

const AddressDisplay = styled.div`
  background-color: #edf2f7;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: monospace;
`;

const Content = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const PatientDashboard = () => {
  const { account, role, shouldLogout } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldLogout) {
      navigate('/');
    } else if (role !== 'patient') {
      navigate('/');
    }
  }, [shouldLogout, role, navigate]);

  if (!account) {
    return null; // Will be redirected by useEffect
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Patient Dashboard</Title>
        <AddressDisplay>{account}</AddressDisplay>
      </Header>
      
      <Content>
        <h2>Welcome to your patient portal</h2>
        <p>Here you can view and manage your prescriptions, medical records, and doctor access.</p>
      </Content>
    </DashboardContainer>
  );
};

export default PatientDashboard;