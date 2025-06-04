import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const DoctorDashboard = () => {
  const { account, role } = useWallet();

  return (
    <DashboardContainer>
      <h1>Doctor Dashboard</h1>
      <p>Welcome, Doctor {account}</p>
      {/* Add doctor-specific components here */}
    </DashboardContainer>
  );
};

export default DoctorDashboard;