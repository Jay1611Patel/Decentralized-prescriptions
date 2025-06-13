import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
`;

const OptionLabel = styled.label`
  cursor: pointer;
  color: #333;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
`;

const CancelButton = styled.button`
  background: #f5f5f5;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const SubmitButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #1565c0;
  }

  &:disabled {
    background: #b0bec5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background: #fde7e7;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const dataOptions = [
  { id: 'name', label: 'Full Name' },
  { id: 'dob', label: 'Date of Birth' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'medications', label: 'Current Medications' },
  { id: 'conditions', label: 'Medical Conditions' }
];

const durationOptions = [
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '1 day' },
  { value: 604800, label: '1 week' },
  { value: 2592000, label: '1 month' },
  { value: 0, label: 'Until revoked' }
];

const PermissionRequest = ({ onClose, onComplete }) => {
  const { account, contract, grantTemporaryAccess } = useWallet();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedData, setSelectedData] = useState([]);
  const [duration, setDuration] = useState(86400);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!contract) return;
      try {
        const doctorList = await contract.getAllDoctors();
        const doctorDetails = await Promise.all(
          doctorList.map(async addr => {
            const profile = await contract.getDoctor(addr);
            return { 
              address: addr, 
              name: profile.name, 
              specialization: profile.specialization 
            };
          })
        );
        setDoctors(doctorDetails.filter(d => d.address !== account));
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    
    fetchDoctors();
  }, [contract, account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || selectedData.length === 0) {
      setError('Please select a doctor and at least one data field');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await grantTemporaryAccess(selectedDoctor, selectedData, duration);
      onComplete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to grant access');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDataField = (fieldId) => {
    setSelectedData(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId) 
        : [...prev, fieldId]
    );
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h3>Grant Temporary Access</h3>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Select Doctor</Label>
            <Select 
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
            >
              <option value="">-- Select a doctor --</option>
              {doctors.map(doctor => (
                <option key={doctor.address} value={doctor.address}>
                  {doctor.name} ({doctor.specialization})
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Select Information to Share</Label>
            <OptionsContainer>
              {dataOptions.map(option => (
                <OptionItem key={option.id}>
                  <Checkbox
                    type="checkbox"
                    id={option.id}
                    checked={selectedData.includes(option.id)}
                    onChange={() => toggleDataField(option.id)}
                  />
                  <OptionLabel htmlFor={option.id}>{option.label}</OptionLabel>
                </OptionItem>
              ))}
            </OptionsContainer>
          </FormGroup>
          
          <FormGroup>
            <Label>Access Duration</Label>
            <Select 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {durationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Granting Access...' : 'Grant Access'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PermissionRequest;