import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
`;

const Title = styled.h2`
  margin: 0;
  color: #1976d2;
`;

const Button = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1565c0;
  }

  &:disabled {
    background: #b0bec5;
    cursor: not-allowed;
  }
`;

const PatientHeader = ({ onRequestAccess }) => {
  const { account } = useWallet();

  return (
    <HeaderContainer>
      <Title>Patient Dashboard</Title>
      {account && (
        <Button onClick={onRequestAccess}>
          Grant Doctor Access
        </Button>
      )}
    </HeaderContainer>
  );
};

export default PatientHeader;