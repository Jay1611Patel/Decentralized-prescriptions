import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
`;

const Button = styled.button`
  background-color: #f6851b;
  color: white;
  border: none;
  padding: 12px 24px;
  margin: 8px 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: #e2761b;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const RegisterButton = styled(Button)`
  background-color: #2196F3;

  &:hover {
    background-color: #0b7dda;
  }
`;

const AddressDisplay = styled.div`
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: rgb(67, 172, 205);
  border-radius: 4px;
  word-break: break-all;
  font-family: monospace;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #ffebee;
  border-radius: 4px;
`;

const MetaMaskIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjZTc2NzFCIiBkPSJNMzQxLjEgMTUzLjZjMTkuOC0yMS4yIDMxLjktNDguNCAzMS45LTc4LjVDMzczIDMzLjYgMzM5LjQgMCAzMDAuNSAwSDgzLjVDMzcuNCAwIDAgMzcuNCAwIDgzLjV2MzQ1YzAgNDYuMSAzNy40IDgzLjUgODMuNSA4My41aDIxN2M0Ni4xIDAgODMuNS0zNy40IDgzLjUtODMuNVYyNTZjMC0zMC4xLTEyLjEtNTcuMy0zMS45LTc4LjR6TTMwMC41IDUxSDI1NnY1MWg0NC41YzE3LjkgMCAzMi41IDE0LjYgMzIuNSAzMi41UzMxOC40IDE2NiAzMDAuNSAxNjZIMjU2djUxaDQ0LjVjMzEuOCAwIDU3LjUtMjUuNyA1Ny41LTU3LjVTMzMyLjMgNTEgMzAwLjUgNTF6TTEwMiAxNTNoNTF2LTUxaC0zNC41Yy0xNy45IDAtMzIuNSAxNC42LTMyLjUgMzIuNVM4NC4xIDE1MyAxMDIgMTUzem0wIDEwMmg1MXYtNTFoLTUxdjUxem0wIDUxaDUxdi01MWgtNTEgICAgdjUxem0wIDUxaDUxdi01MWgtNTEgICAgdjUxem0wIDUxaDUxdi01MWgtNTEgICAgdjUxeiIvPjwvc3ZnPg==');
  background-size: contain;
`;

const Login = () => {
  const { 
    account,
    role, 
    loading, 
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
      navigate(`/${role}-dashboard`);
    }
  }, [account, role, loading, navigate, shouldLogout]);

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