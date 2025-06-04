import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const PatientDashboard = () => {
  const { account, role } = useWallet();

  return (
    <DashboardContainer>
      <h1>Patient Dashboard</h1>
      <p>Welcome, Patient {account}</p>
      {/* Add patient-specific components here */}
    </DashboardContainer>
  );
};

export default PatientDashboard;