import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAddress } from 'ethers';
import { useWallet } from '../../context/WalletContext';

const PrescriptionDetailModal = ({ prescription, onClose }) => {
  const [prescriptionDetails, setPrescriptionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        
        // Try to parse the prescription data
        try {
          const details = JSON.parse(prescription.prescriptionHash);
          setPrescriptionDetails(details);
        } catch (e) {
          // Fallback for legacy hashed prescriptions
          setPrescriptionDetails({
            medication: "Unknown",
            instructions: "Could not parse prescription details",
            rawData: prescription.prescriptionHash
          });
        }
      } catch (error) {
        console.error("Error loading prescription:", error);
        setError("Failed to load prescription details");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [prescription]);

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <ModalOverlay>
        <ModalContainer>
          <LoadingMessage>Loading prescription details...</LoadingMessage>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h3>Prescription Details</h3>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <ModalContent>
            <DetailSection>
              <h4>Prescription Information</h4>
              <DetailRow>
                <DetailLabel>ID:</DetailLabel>
                <DetailValue>{prescription.id}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Status:</DetailLabel>
                <DetailValue>
                  {prescription.isFulfilled ? 'Fulfilled' : 'Active'}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Issued:</DetailLabel>
                <DetailValue>{formatDate(prescription.issueDate)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Expires:</DetailLabel>
                <DetailValue>{formatDate(prescription.expiryDate)}</DetailValue>
              </DetailRow>
            </DetailSection>

            <DetailSection>
              <h4>Medication Details</h4>
              {prescriptionDetails ? (
                <>
                  <DetailRow>
                    <DetailLabel>Medication:</DetailLabel>
                    <DetailValue>{prescriptionDetails.medication || 'Not specified'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Dosage:</DetailLabel>
                    <DetailValue>{prescriptionDetails.dosage || 'Not specified'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Frequency:</DetailLabel>
                    <DetailValue>{prescriptionDetails.frequency || 'Not specified'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Instructions:</DetailLabel>
                    <DetailValue>{prescriptionDetails.instructions || 'None provided'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Refills:</DetailLabel>
                    <DetailValue>{prescriptionDetails.refills || '0'}</DetailValue>
                  </DetailRow>
                </>
              ) : (
                <p>No medication details available</p>
              )}
            </DetailSection>
          </ModalContent>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

// New styled components
const WarningBanner = styled.div`
  padding: 12px;
  margin: 0 20px;
  background-color: #fff3cd;
  color: #856404;
  border-radius: 4px;
  text-align: center;
`;

const FallbackTag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  margin-left: 10px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

// Styled Components (focused on medication display)
const MedicationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background-color: #f5f7fa;
    font-weight: 600;
  }
  
  tr:hover {
    background-color: #f8f9fa;
  }
`;

const NotesSection = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  
  h5 {
    margin-top: 0;
    color: #555;
  }
`;

const NoMedications = styled.div`
  padding: 20px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #666;
`;

const MedTableHeader = styled.th`
  padding: 10px;
  text-align: left;
  background-color: #f0f7ff;
  border-bottom: 2px solid #4a90e2;
`;

const MedTableCell = styled.td`
  padding: 10px;
  border-bottom: 1px solid #eee;
  color: #666;
`;

const DoctorNotes = styled.div`
  padding: 15px;
  background-color: #fffaf0;
  border-left: 3px solid #ffd700;
  margin: 10px 0;
  white-space: pre-line;
  color: #666;
`;

const RawDataSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ccc;
  color: #666;
  
  h5 {
    color: #666;
    margin-bottom: 10px;
  }
`;

const LicenseLink = styled.a`
  color: #4a90e2;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  padding: 20px;
  color: #721c24;
  background-color: #f8d7da;
  border-radius: 4px;
  margin: 20px;
  text-align: center;
`;

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  color: #666;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const ModalContent = styled.div`
  padding: 20px;
`;

const DetailSection = styled.div`
  margin-bottom: 25px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #4a90e2;
    font-size: 1.1rem;
  }
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const DetailLabel = styled.div`
  font-weight: 600;
  width: 150px;
  color: #555;
`;

const DetailValue = styled.div`
  flex: 1;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.fulfilled ? '#d4edda' : '#fff3cd'};
  color: ${props => props.fulfilled ? '#155724' : '#856404'};
`;

const PrescriptionData = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: monospace;
  word-break: break-all;
  white-space: pre-wrap;
`;

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
`;

export default PrescriptionDetailModal;