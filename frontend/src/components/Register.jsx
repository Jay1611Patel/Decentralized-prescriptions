import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const Register = () => {
  const navigate = useNavigate();
  const { account, registerPatient } = useWallet();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setIsRegistering(true);
    setError('');
    
    try {
      const success = await registerPatient();
      if (success) {
        navigate('/patient-signup');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div>
      <h1>Registration</h1>
      <p>Connected as: {account}</p>
      <button onClick={handleRegister} disabled={isRegistering}>
        {isRegistering ? 'Registering...' : 'Register as Patient'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Register;