import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #4a5568;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SubmitButton = styled.button`
  background-color: #4c51bf;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #434190;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e53e3e;
  margin-top: 1rem;
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4c51bf;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 1rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PatientSignup = () => {
  const { 
    account, 
    role,
    storePatientData,
    checkPatientProfileComplete,
    loading
  } = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    contactInfo: '',
    medicalHistory: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect logic
  useEffect(() => {
    if (loading) return;

    const checkAndRedirect = async () => {
      if (!account) {
        navigate('/');
        return;
      }

      if (role && role !== 'patient') {
        navigate(`/${role}-dashboard`);
        return;
      }

      try {
        const isComplete = await checkPatientProfileComplete(account);
        if (isComplete) {
          navigate('/patient-dashboard');
        }
      } catch (err) {
        console.error("Profile check error:", err);
      }
    };

    checkAndRedirect();
  }, [account, role, loading, navigate, checkPatientProfileComplete]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Store patient data
      await storePatientData(formData);
      
      // 2. Verify the data was stored successfully
      let isComplete = false;
      let attempts = 0;
      const maxAttempts = 5;
      const delay = 2000; // 2 seconds between checks

      while (!isComplete && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, delay));
        isComplete = await checkPatientProfileComplete(account);
      }

      if (isComplete) {
        // 3. Redirect only after successful verification
        navigate('/patient-dashboard');
      } else {
        setError("Profile creation is taking longer than expected. Please check back soon.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      if (!error) {
        setIsSubmitting(false);
      }
    }
  };

  if (loading || !account || (role && role !== 'patient')) {
    return null; // Will be redirected by useEffect
  }

  return (
    <FormContainer>
      <FormTitle>Complete Your Patient Profile</FormTitle>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Full Name</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={(e) => setFormData({...formData, dob: e.target.value})}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="contactInfo">Contact Information</Label>
          <Input
            type="text"
            id="contactInfo"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
            placeholder="Phone number or email"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="medicalHistory">Medical History (Optional)</Label>
          <TextArea
            id="medicalHistory"
            name="medicalHistory"
            value={formData.medicalHistory}
            onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
            placeholder="Any known allergies, chronic conditions, or other medical information"
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Complete Registration'}
        </SubmitButton>
      </form>
    </FormContainer>
  );
};

export default PatientSignup;