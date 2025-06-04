import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const PharmacistDashboard = () => {
  const { account, role } = useWallet();

  return (
    <DashboardContainer>
      <h1>Pharmacist Dashboard</h1>
      <p>Welcome, Pharmacist {account}</p>
      {/* Add pharmacist-specific components here */}
    </DashboardContainer>
  );
};

export default PharmacistDashboard;