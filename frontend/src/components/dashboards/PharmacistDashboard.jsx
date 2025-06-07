import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';
import PrescriptionFulfillment from '../PrescriptionFulfillment';
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

const PharmacistDashboard = () => {
  const { account, role } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      navigate('/');
    } else if (role !== 'pharmacist') {
      navigate(`/${role}-dashboard`);
    }
  }, [account, role, navigate]);

  return (
    <DashboardContainer>
      <Header>
        <Title>Pharmacist Dashboard</Title>
        <WalletInfo>{account}</WalletInfo>
      </Header>

      <Section>
        <SectionTitle>Prescription Management</SectionTitle>
        <CardGrid>
          <Card>
            <CardTitle>Fulfill Prescription</CardTitle>
            <p>Process and fulfill patient prescriptions</p>
            <Button onClick={() => navigate('/fulfill-prescription')}>
              View Pending
            </Button>
          </Card>
          <Card>
            <CardTitle>Prescription History</CardTitle>
            <p>View your fulfilled prescriptions</p>
            <Button onClick={() => navigate('/pharmacist-history')}>
              View History
            </Button>
          </Card>
        </CardGrid>
      </Section>

      <Section>
        <SectionTitle>Inventory</SectionTitle>
        <CardGrid>
          <Card>
            <CardTitle>Medication Stock</CardTitle>
            <p>Manage your pharmacy inventory</p>
            <Button onClick={() => navigate('/pharmacy-inventory')}>
              View Inventory
            </Button>
          </Card>
        </CardGrid>
      </Section>
    </DashboardContainer>
  );
};

export default PharmacistDashboard;