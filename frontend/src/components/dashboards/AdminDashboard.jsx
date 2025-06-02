import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const AdminDashboard = () => {
  const { account, role } = useWallet();

  return (
    <DashboardContainer>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin {account}</p>
      {/* Add Admin-specific components here */}
    </DashboardContainer>
  );
};

export default AdminDashboard;