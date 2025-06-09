import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '../../context/WalletContext';

const PrescriptionContainer = styled.div`
  margin-top: 1.5rem;
`;

const PrescriptionCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const PrescriptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PrescriptionTitle = styled.h3`
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0;
`;

const PrescriptionStatus = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: ${props => 
    props.status === 'active' ? '#ebf8ff' : 
    props.status === 'fulfilled' ? '#f0fff4' : 
    '#fff5f5'};
  color: ${props => 
    props.status === 'active' ? '#3182ce' : 
    props.status === 'fulfilled' ? '#38a169' : 
    '#e53e3e'};
`;

const PrescriptionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  & > strong {
    display: block;
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.25rem;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #718096;
  padding: 2rem;
`;

const LoadingMessage = styled.p`
  text-align: center;
  color: #718096;
  padding: 2rem;
`;

const PrescriptionList = ({ patientAddress }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { contract } = useWallet();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!contract || !patientAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        // In a real implementation, you would call the contract to get prescriptions
        // For example:
        // const prescriptionIds = await contract.getPatientPrescriptions(patientAddress);
        // const fetchedPrescriptions = await Promise.all(
        //   prescriptionIds.map(id => contract.getPrescription(id))
        // );

        // Mock data for demonstration
        const mockPrescriptions = [
          {
            id: 1,
            doctor: 'Dr. Smith',
            doctorAddress: '0x123...456',
            medication: 'Ibuprofen 400mg',
            dosage: '1 tablet every 6 hours as needed',
            issueDate: '2023-10-15',
            expiryDate: '2024-01-15',
            isFulfilled: false,
            fulfilledBy: null,
            fulfillmentDate: null,
            notes: 'For headache and fever'
          },
          {
            id: 2,
            doctor: 'Dr. Johnson',
            doctorAddress: '0x789...012',
            medication: 'Amoxicillin 500mg',
            dosage: '1 capsule every 8 hours for 7 days',
            issueDate: '2023-09-20',
            expiryDate: '2023-10-20',
            isFulfilled: true,
            fulfilledBy: 'City Pharmacy',
            fulfillmentDate: '2023-09-21',
            notes: 'For bacterial infection'
          }
        ];

        setPrescriptions(mockPrescriptions);
      } catch (err) {
        console.error('Failed to fetch prescriptions:', err);
        setError('Failed to load prescriptions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [contract, patientAddress]);

  const getStatus = (prescription) => {
    const now = new Date();
    const expiryDate = new Date(prescription.expiryDate);
    
    if (prescription.isFulfilled) return 'fulfilled';
    if (now > expiryDate) return 'expired';
    return 'active';
  };

  if (isLoading) {
    return <LoadingMessage>Loading prescriptions...</LoadingMessage>;
  }

  if (error) {
    return <EmptyMessage>{error}</EmptyMessage>;
  }

  if (prescriptions.length === 0) {
    return <EmptyMessage>No prescriptions found</EmptyMessage>;
  }

  return (
    <PrescriptionContainer>
      {prescriptions.map((prescription) => {
        const status = getStatus(prescription);
        
        return (
          <PrescriptionCard key={prescription.id}>
            <PrescriptionHeader>
              <PrescriptionTitle>
                {prescription.medication}
              </PrescriptionTitle>
              <PrescriptionStatus status={status}>
                {status === 'active' && 'Active'}
                {status === 'fulfilled' && 'Fulfilled'}
                {status === 'expired' && 'Expired'}
              </PrescriptionStatus>
            </PrescriptionHeader>

            <PrescriptionDetails>
              <DetailItem>
                <strong>Prescribed by</strong>
                {prescription.doctor}
              </DetailItem>
              <DetailItem>
                <strong>Date Issued</strong>
                {prescription.issueDate}
              </DetailItem>
              <DetailItem>
                <strong>Expiry Date</strong>
                {prescription.expiryDate}
              </DetailItem>
              <DetailItem>
                <strong>Dosage</strong>
                {prescription.dosage}
              </DetailItem>
              {prescription.isFulfilled && (
                <>
                  <DetailItem>
                    <strong>Fulfilled by</strong>
                    {prescription.fulfilledBy}
                  </DetailItem>
                  <DetailItem>
                    <strong>Fulfillment Date</strong>
                    {prescription.fulfillmentDate}
                  </DetailItem>
                </>
              )}
            </PrescriptionDetails>

            {prescription.notes && (
              <DetailItem>
                <strong>Notes</strong>
                {prescription.notes}
              </DetailItem>
            )}
          </PrescriptionCard>
        );
      })}
    </PrescriptionContainer>
  );
};

export default PrescriptionList;