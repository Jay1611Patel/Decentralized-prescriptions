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
  background-color: ${(props) =>
    props.status === 'active'
      ? '#ebf8ff'
      : props.status === 'fulfilled'
      ? '#f0fff4'
      : '#fff5f5'};
  color: ${(props) =>
    props.status === 'active'
      ? '#3182ce'
      : props.status === 'fulfilled'
      ? '#38a169'
      : '#e53e3e'};
`;

const PrescriptionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  color: black;
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

const formatDate = (timestamp) => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const PrescriptionList = ({ patientAddress }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorNames, setDoctorNames] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { contracts } = useWallet();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!contracts.prescriptionRegistry || !patientAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        const ids = await contracts.prescriptionRegistry.getPatientPrescriptions(patientAddress);

        const all = await Promise.all(
          ids.map(async (id) => {
            const p = await contracts.prescriptionRegistry.getPrescription(id);
            return {
              id: id.toString(),
              doctor: p[0],
              patient: p[1],
              issueDate: p[2],
              expiryDate: p[3],
              hash: p[4],
              isFulfilled: p[5],
              fulfilledBy: p[6],
              fulfillmentDate: p[7],
            };
          })
        );

        const uniqueDoctors = [...new Set(all.map(p => p.doctor))];
        const names = {};

        for (const address of uniqueDoctors) {
          try {
            const doc = await contracts.medicalAccess.getDoctor(address);
            const name = doc.name || `Doctor (${address.slice(0, 6)}...${address.slice(-4)})`;
            names[address] = name;
          } catch (e) {
            names[address] = `Doctor (${address.slice(0, 6)}...${address.slice(-4)})`;
          }
        }

        setDoctorNames(names);
        setPrescriptions(all);
      } catch (err) {
        console.error('Failed to fetch prescriptions:', err);
        setError('Failed to load prescriptions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [contracts.prescriptionRegistry, contracts.medicalAccess, patientAddress]);

  const getStatus = (prescription) => {
    const now = Math.floor(Date.now() / 1000);
    const expiry = Number(prescription.expiryDate);
    if (prescription.isFulfilled) return 'fulfilled';
    if (now > expiry) return 'expired';
    return 'active';
  };

  if (isLoading) return <LoadingMessage>Loading prescriptions...</LoadingMessage>;
  if (error) return <EmptyMessage>{error}</EmptyMessage>;
  if (prescriptions.length === 0) return <EmptyMessage>No prescriptions found</EmptyMessage>;

  return (
    <PrescriptionContainer>
      {prescriptions.map((p) => {
        const status = getStatus(p);
        return (
          <PrescriptionCard key={p.id}>
            <PrescriptionHeader>
              <PrescriptionTitle>Prescription #{p.id}</PrescriptionTitle>
              <PrescriptionStatus status={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</PrescriptionStatus>
            </PrescriptionHeader>
            <PrescriptionDetails>
              <DetailItem><strong>Doctor</strong>{doctorNames[p.doctor] || p.doctor}</DetailItem>
              <DetailItem><strong>Issued</strong>{formatDate(p.issueDate)}</DetailItem>
              <DetailItem><strong>Expires</strong>{formatDate(p.expiryDate)}</DetailItem>
              <DetailItem><strong>Status</strong>{status}</DetailItem>
              {p.isFulfilled && (
                <>
                  <DetailItem><strong>Fulfilled By</strong>{p.fulfilledBy}</DetailItem>
                  <DetailItem><strong>Fulfillment Date</strong>{formatDate(p.fulfillmentDate)}</DetailItem>
                </>
              )}
            </PrescriptionDetails>
          </PrescriptionCard>
        );
      })}
    </PrescriptionContainer>
  );
};

export default PrescriptionList;
