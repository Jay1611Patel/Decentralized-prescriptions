import { useState } from 'react';
import styled from 'styled-components';
import { useWallet } from '../context/WalletContext';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #4a5568;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
`;

const DateInput = styled(Input)`
  width: 200px;
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
  align-self: flex-start;
  transition: background-color 0.2s;

  &:hover {
    background-color: #434190;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const CreatePrescription = ({ patientAddress }) => {
  const [formData, setFormData] = useState({
    medication: '',
    dosage: '',
    instructions: '',
    expiryDate: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { contract } = useWallet();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // In a real app, you would:
      // 1. Upload prescription details to IPFS
      // 2. Call createPrescription on the contract with the IPFS hash
      // 3. Wait for transaction confirmation
      
      // Simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (error) {
      setError('Failed to create prescription: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer>
      <p>Creating prescription for patient: {patientAddress}</p>
      
      <FormGroup>
        <Label htmlFor="medication">Medication</Label>
        <Input
          type="text"
          id="medication"
          name="medication"
          value={formData.medication}
          onChange={handleChange}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="dosage">Dosage</Label>
        <Input
          type="text"
          id="dosage"
          name="dosage"
          value={formData.dosage}
          onChange={handleChange}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="instructions">Instructions</Label>
        <TextArea
          id="instructions"
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <DateInput
          type="date"
          id="expiryDate"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="notes">Additional Notes</Label>
        <TextArea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </FormGroup>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Prescription created successfully!</p>}

      <SubmitButton onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Prescription'}
      </SubmitButton>
    </FormContainer>
  );
};

export default CreatePrescription;