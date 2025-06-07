import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';
import PatientSearch from '../PatientSearch';
import CreatePrescription from '../CreatePrescription';
import { useNavigate } from 'react-router-dom';

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
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2d3748;
`;

const WalletInfo = styled.div`
  background-color: #edf2f7;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-family: monospace;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #2d3748;
`;

const Button = styled.button`
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3182ce;
  }
`;

const DoctorDashboard = () => {
  const { account, role } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      navigate('/');
    } else if (role !== 'doctor') {
      navigate(`/${role}-dashboard`);
    }
  }, [account, role, navigate]);

  return (
    <DashboardContainer>
      <Header>
        <Title>Doctor Dashboard</Title>
        <WalletInfo>{account}</WalletInfo>
      </Header>

      <Section>
        <SectionTitle>Patient Management</SectionTitle>
        <CardGrid>
          <Card>
            <CardTitle>Create Prescription</CardTitle>
            <p>Issue a new prescription for your patient</p>
            <Button onClick={() => navigate('/create-prescription')}>
              New Prescription
            </Button>
          </Card>
          <Card>
            <CardTitle>Patient Records</CardTitle>
            <p>View and manage patient medical records</p>
            <Button onClick={() => navigate('/patient-records')}>
              Access Records
            </Button>
          </Card>
        </CardGrid>
      </Section>

      <Section>
        <SectionTitle>Your Activity</SectionTitle>
        <CardGrid>
          <Card>
            <CardTitle>Recent Prescriptions</CardTitle>
            <p>View your recently issued prescriptions</p>
            <Button onClick={() => navigate('/doctor-prescriptions')}>
              View Prescriptions
            </Button>
          </Card>
        </CardGrid>
      </Section>
    </DashboardContainer>
  );
};

export default DoctorDashboard;