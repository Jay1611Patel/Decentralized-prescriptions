import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ethers } from 'ethers';
import styled from 'styled-components';

// Styled components
const PrescriptionContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
`;

const SubmitButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const CancelButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 5px;
  font-size: 14px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
`;

const PrescriptionsTab = ({ showNewPrescription, onClose }) => {
  const { account, contracts, getPatientData } = useWallet();
  const [patientsWithAccess, setPatientsWithAccess] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [patientNames, setPatientNames] = useState({});
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patientAddress: '',
    expiryDays: '30',
    medication: '',
    dosage: '',
    frequency: '',
    instructions: '',
    refills: '0'
  });

  // Load patients who have granted access to this doctor
  useEffect(() => {
    const fetchPatientsWithAccess = async () => {
      if (!contracts?.medicalAccess || !account) return;
      
      setLoadingPatients(true);
      setError('');
      
      try {
        // Get all active permissions for this doctor
        const activePermissions = await contracts.medicalAccess.getDoctorAccess();
        
        // Extract unique patient addresses
        const patientAddresses = [...new Set(
          activePermissions
            .filter(p => p.isActive && p.expiryTime > Math.floor(Date.now()/1000))
            .map(p => p.patient)
        )];
        
        // Get patient details (name from IPFS if available)
        const patients = await Promise.all(
          patientAddresses.map(async address => {
            try {
              const cid = await contracts.medicalAccess.getPatientCID(address);
              const data = cid ? await getPatientData(cid) : {};
              return { 
                address, 
                name: data.name || `Patient (${address.slice(0,6)}...${address.slice(-4)})` 
              };
            } catch {
              return { 
                address, 
                name: `Patient (${address.slice(0,6)}...${address.slice(-4)})` 
              };
            }
          })
        );
        
        setPatientsWithAccess(patients);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
        setError('Failed to load patient list');
      } finally {
        setLoadingPatients(false);
      }
    };

    if (showNewPrescription) {
      fetchPatientsWithAccess();
    }
  }, [contracts?.medicalAccess, account, showNewPrescription, getPatientData]);

  useEffect(() => {
    const loadActivePrescriptions = async () => {
      if (!contracts?.prescriptionRegistry || !contracts?.medicalAccess || !account) return;

      setLoadingPrescriptions(true);

      try {
        const ids = await contracts.prescriptionRegistry.getDoctorPrescriptions(account);
        const data = await Promise.all(
          ids.map(async id => {
            const p = await contracts.prescriptionRegistry.getPrescription(id);
            
            return {
              id: id.toString(),
              doctor: p[0],
              patient: p[1],
              issueDate: Number(p[2]),
              expiryDate: Number(p[3]),
              hash: p[4],
              isFulfilled: p[5],
              fulfilledBy: p[6],
              fulfillmentDate: Number(p[7])
            };
          })
        );

        const active = data.filter(p => !p.isFulfilled);
        setActivePrescriptions(active);

        // Resolve patient names
        const uniqueAddresses = [...new Set(active.map(p => p.patient))];
        const names = {};

        for (const address of uniqueAddresses) {
          try {
            const cid = await contracts.medicalAccess.getPatientCID(address);
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            const json = await response.json();
            names[address] = json.name || `Patient (${address.slice(0, 6)}...${address.slice(-4)})`;
          } catch {
            names[address] = `Patient (${address.slice(0, 6)}...${address.slice(-4)})`;
          }
        }

        setPatientNames(names);
      } catch (err) {
        console.error("Failed to load active prescriptions:", err);
      } finally {
        setLoadingPrescriptions(false);
      }
    };

    loadActivePrescriptions();
  }, [contracts, account]);


  const handlePatientSelect = (e) => {
    const address = e.target.value;
    setSelectedPatient(address);
    setFormData(prev => ({ ...prev, patientAddress: address }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate patient address
      if (!ethers.isAddress(selectedPatient)) {
        throw new Error('Invalid patient address');
      }
      
      // Create structured prescription data
      const prescriptionData = {
        medication: formData.medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions,
        refills: formData.refills,
        issuedBy: account,
        issuedTo: selectedPatient,
        timestamp: Date.now()
      };

      // Stringify the data (don't hash it)
      const prescriptionDataString = JSON.stringify(prescriptionData);
      
      // Calculate expiry date
      const expiryDate = Math.floor(Date.now() / 1000) + (parseInt(formData.expiryDays) * 86400);
      
      // Call the contract with the JSON string
      const tx = await contracts.prescriptionRegistry.createPrescription(
        selectedPatient,
        expiryDate,
        prescriptionDataString, // Store the actual data, not hash
        { gasLimit: 1000000 }
      );
      
      await tx.wait();
      
      // Reset form
      setFormData({
        patientAddress: '',
        expiryDays: '30',
        medication: '',
        dosage: '',
        frequency: '',
        instructions: '',
        refills: '0'
      });
      setSelectedPatient('');
      
      onClose();
    } catch (err) {
      console.error("Prescription creation failed:", err);
      setError(err.message || 'Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <PrescriptionContainer style={{ background: '#f9f9f9' }}>
    {showNewPrescription && (
      <>
        <h3 style={{ color: '#2c3e50' }}>New Prescription</h3>
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Patient</Label>
            {loadingPatients ? (
              <LoadingText>Loading patients...</LoadingText>
            ) : (
              <Select
                value={selectedPatient}
                onChange={handlePatientSelect}
                required
                disabled={isSubmitting}
              >
                <option value="">-- Select Patient --</option>
                {patientsWithAccess.map(patient => (
                  <option key={patient.address} value={patient.address}>
                    {patient.name}
                  </option>
                ))}
              </Select>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Expires In</Label>
            <Select
              name="expiryDays"
              value={formData.expiryDays}
              onChange={handleInputChange}
              disabled={isSubmitting}
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Medication Name</Label>
            <Input
              type="text"
              name="medication"
              value={formData.medication}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup>
            <Label>Dosage</Label>
            <Input
              type="text"
              name="dosage"
              value={formData.dosage}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              placeholder="e.g., 500mg"
            />
          </FormGroup>

          <FormGroup>
            <Label>Frequency</Label>
            <Input
              type="text"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              placeholder="e.g., Twice daily"
            />
          </FormGroup>

          <FormGroup>
            <Label>Instructions</Label>
            <TextArea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Special instructions for use"
            />
          </FormGroup>

          <FormGroup>
            <Label>Refills Allowed</Label>
            <Select
              name="refills"
              value={formData.refills}
              onChange={handleInputChange}
              disabled={isSubmitting}
            >
              <option value="0">No refills</option>
              <option value="1">1 refill</option>
              <option value="2">2 refills</option>
              <option value="3">3 refills</option>
              <option value="4">4+ refills</option>
            </Select>
          </FormGroup>

          <ButtonGroup>
            <CancelButton
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </CancelButton>
            <SubmitButton
              type="submit"
              disabled={isSubmitting || !selectedPatient}
            >
              {isSubmitting ? 'Creating...' : 'Create Prescription'}
            </SubmitButton>
          </ButtonGroup>
        </form>

        <hr style={{ margin: '40px 0', borderColor: '#ccc' }} />
      </>
    )}

    <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Active Prescriptions</h3>
    {loadingPrescriptions ? (
      <LoadingText>Loading prescriptions...</LoadingText>
    ) : activePrescriptions.length === 0 ? (
      <LoadingText>No active prescriptions</LoadingText>
    ) : (
      <div>
        {activePrescriptions.map(p => (
          <div
            key={p.id}
            style={{
              background: 'white',
              padding: '15px 20px',
              marginBottom: '15px',
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              color: '#2c3e50',
            }}
          >
            <p><strong style={{ color: '#34495e' }}>Prescription #{p.id}</strong></p>
            <p><strong>Patient:</strong> {patientNames[p.patient] || p.patient}</p>
            <p><strong>Issued:</strong> {new Date(p.issueDate * 1000).toLocaleDateString()}</p>
            <p><strong>Expires:</strong> {new Date(p.expiryDate * 1000).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    )}
  </PrescriptionContainer>
);



};

export default PrescriptionsTab;