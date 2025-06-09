import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '../context/WalletContext';

const PrescriptionItem = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PrescriptionInfo = styled.div`
  flex: 1;
`;

const FulfillButton = styled.button`
  background-color: #38a169;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2f855a;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const PrescriptionFulfillment = ({ pharmacistAddress }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { contract } = useWallet();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setIsLoading(true);
      try {
        // Simulate fetching prescriptions
        const mockPrescriptions = [
          {
            id: 1,
            doctor: 'Dr. Smith',
            patient: 'John Doe',
            medication: 'Ibuprofen',
            expiryDate: '2023-12-31',
            isFulfilled: false
          },
          {
            id: 2,
            doctor: 'Dr. Johnson',
            patient: 'Jane Smith',
            medication: 'Amoxicillin',
            expiryDate: '2023-11-30',
            isFulfilled: false
          }
        ];
        setPrescriptions(mockPrescriptions);
      } catch (error) {
        setError('Failed to fetch prescriptions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [contract, pharmacistAddress]);

  const handleFulfill = async (prescriptionId) => {
    setIsLoading(true);
    try {
      // In a real app, you would call fulfillPrescription on the contract
      // and wait for the transaction to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPrescriptions(prev => 
        prev.map(p => 
          p.id === prescriptionId ? { ...p, isFulfilled: true } : p
        )
      );
    } catch (error) {
      setError('Failed to fulfill prescription');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && prescriptions.length === 0) {
    return <p>Loading prescriptions...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h3>Pending Prescriptions</h3>
      {prescriptions.filter(p => !p.isFulfilled).length === 0 ? (
        <p>No pending prescriptions</p>
      ) : (
        prescriptions
          .filter(p => !p.isFulfilled)
          .map(prescription => (
            <PrescriptionItem key={prescription.id}>
              <PrescriptionInfo>
                <p><strong>Patient:</strong> {prescription.patient}</p>
                <p><strong>Medication:</strong> {prescription.medication}</p>
                <p><strong>Prescribed by:</strong> {prescription.doctor}</p>
                <p><strong>Expires:</strong> {prescription.expiryDate}</p>
              </PrescriptionInfo>
              <FulfillButton
                onClick={() => handleFulfill(prescription.id)}
                disabled={isLoading}
              >
                Fulfill
              </FulfillButton>
            </PrescriptionItem>
          ))
      )}

      <h3>Fulfilled Prescriptions</h3>
      {prescriptions.filter(p => p.isFulfilled).length === 0 ? (
        <p>No fulfilled prescriptions</p>
      ) : (
        prescriptions
          .filter(p => p.isFulfilled)
          .map(prescription => (
            <PrescriptionItem key={prescription.id}>
              <PrescriptionInfo>
                <p><strong>Patient:</strong> {prescription.patient}</p>
                <p><strong>Medication:</strong> {prescription.medication}</p>
                <p><strong>Prescribed by:</strong> {prescription.doctor}</p>
                <p><strong>Fulfilled on:</strong> {new Date().toLocaleDateString()}</p>
              </PrescriptionInfo>
              <span style={{ color: 'green' }}>✓ Fulfilled</span>
            </PrescriptionItem>
          ))
      )}
    </div>
  );
};

export default PrescriptionFulfillment;