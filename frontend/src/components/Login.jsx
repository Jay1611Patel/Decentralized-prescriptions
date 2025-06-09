import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import styled from 'styled-components';
import { MetaMaskIcon } from '../utils/Icons';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
`;

const Button = styled.button`
  background-color: #f6851b;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e2761b;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const RegisterButton = styled(Button)`
  background-color: #4c51bf;

  &:hover {
    background-color: #434190;
  }
`;

const AddressDisplay = styled.div`
  background-color: #edf2f7;
  padding: 0.8rem;
  border-radius: 8px;
  font-family: monospace;
  word-break: break-all;
  margin: 1rem 0;
`;

const ErrorMessage = styled.p`
  color: #e53e3e;
  margin-top: 1rem;
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #f6851b;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 1rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Login = () => {
  const { 
    account,
    role, 
    loading, 
    contract,
    isConnecting,
    error,
    connectWallet,
    isMetaMaskInstalled,
    registerAsPatient,
    shouldLogout
  } = useWallet();
  
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  // Handle redirection based on role and logout state
  useEffect(() => {
    if (loading) return;

    if (shouldLogout) {
      navigate('/');
      return;
    }

    if (account && role) {
      if (role === 'patient') {
        // Check if contract is available
        if (!contract) {
          console.error('Contract not initialized');
          return;
        }

        // Check if CID is stored
        contract.getPatientCID(account)
          .then(cid => {
            if (!cid || cid === '') {
              navigate('/patient-signup');
            } else {
              navigate('/patient-dashboard');
            }
          })
          .catch(err => {
            console.error('Error checking patient CID:', err);
            navigate('/patient-signup');
          });
      } else {
        navigate(`/${role}-dashboard`);
      }
    }
  }, [account, role, loading, navigate, shouldLogout, contract]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  const handleRegister = async () => {
    setRegistrationError(null);
    setIsRegistering(true);
    try {
      const success = await registerAsPatient();
      if (!success) {
        setRegistrationError('Patient registration failed. Please try again.');
      }
    } catch (err) {
      setRegistrationError(err.message || 'Registration error occurred');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <LoginContainer>
        <Card>
          <Title>Loading...</Title>
        </Card>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <Card>
        <Title>Decentralized Prescription System</Title>
        
        {!account ? (
          <>
            <p>Connect your wallet to access the system</p>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting || !isMetaMaskInstalled}
            >
              <MetaMaskIcon />
              {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
            </Button>
            
            {!isMetaMaskInstalled && (
              <p style={{ color: '#666', marginTop: '8px' }}>
                You'll need to install <a 
                  href="https://metamask.io/download.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#f6851b', fontWeight: '600' }}
                >
                  MetaMask
                </a> first
              </p>
            )}
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </>
        ) : (
          <>
            <p>Connected Wallet:</p>
            <AddressDisplay>{account}</AddressDisplay>
            
            {!role && (
              <>
                <p>You are not registered in the system.</p>
                <RegisterButton 
                  onClick={handleRegister} 
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Registering...' : 'Register as Patient'}
                </RegisterButton>
                {registrationError && <ErrorMessage>{registrationError}</ErrorMessage>}
                <p style={{ marginTop: '1rem', color: '#666' }}>
                  Note: Doctor and pharmacist accounts must be registered by an administrator.
                </p>
              </>
            )}

            {role && <p>Redirecting to your dashboard...</p>}
          </>
        )}
      </Card>
    </LoginContainer>
  );
};

export default Login;