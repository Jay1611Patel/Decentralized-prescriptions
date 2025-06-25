import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import { getAddress } from 'ethers';
import PrescriptionDetailModal from './PrescriptionDetailModal';

const PendingFulfillmentsTab = () => {
  const { account, contracts } = useWallet();
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [selectedPrescription, setSelectedPrescription] = useState(null);


  // Load saved statuses from localStorage on component mount
  useEffect(() => {
    const savedStatuses = localStorage.getItem('pharmacistPrescriptionStatuses');
    if (savedStatuses) {
      setStatusUpdates(JSON.parse(savedStatuses));
    }
  }, []);

  // Save statuses to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(statusUpdates).length > 0) {
      localStorage.setItem('pharmacistPrescriptionStatuses', JSON.stringify(statusUpdates));
    }
  }, [statusUpdates]);

  useEffect(() => {
    const fetchPendingPrescriptions = async () => {
      try {
        const registry = contracts.prescriptionRegistry;
        const count = await registry.getPrescriptionCount();
        
        const pending = [];
        
        for (let i = 1; i <= count; i++) {
          try {
            const p = await registry.getPrescription(i);
            const prescription = {
                    id: i,
                    doctor: p[0],
                    patient: p[1],
                    issueDate: Number(p[2]),
                    expiryDate: Number(p[3]),
                    prescriptionHash: p[4],
                    isFulfilled: p[5],
                    fulfilledBy: p[6],
                    fulfillmentDate: Number(p[7]),
                    status: statusUpdates[i] || 'In Progress'
                };
            if (!prescription.isFulfilled && prescription.expiryDate > Math.floor(Date.now()/1000)) {
              pending.push(prescription);
            }
          } catch (error) {
            console.error(`Error fetching prescription ${i}:`, error);
          }
        }

        setPendingPrescriptions(pending);
      } catch (error) {
        console.error("Error fetching pending prescriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPrescriptions();
  }, [contracts, statusUpdates]);

  const updateStatus = (id, status) => {
    setStatusUpdates(prev => {
      const newStatuses = {
        ...prev,
        [id]: status
      };
      // Update the local prescription state immediately for better UX
      setPendingPrescriptions(prev => prev.map(p => 
        p.id === id ? { ...p, status } : p
      ));
      return newStatuses;
    });
  };

  const completeFulfillment = async (prescriptionId) => {
    try {
      const tx = await contracts.prescriptionRegistry.fulfillPrescription(prescriptionId);
      await tx.wait();
      
      // Remove from local state and status updates
      setPendingPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
      setStatusUpdates(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[prescriptionId];
        return newStatuses;
      });
      
      // Also remove from localStorage
      const savedStatuses = JSON.parse(localStorage.getItem('pharmacistPrescriptionStatuses') || '{}');
      delete savedStatuses[prescriptionId];
      localStorage.setItem('pharmacistPrescriptionStatuses', JSON.stringify(savedStatuses));
      
    } catch (error) {
      console.error("Error completing fulfillment:", error);
      alert(`Failed to complete fulfillment: ${error.message}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toISOString().split('T')[0];
  };

  if (loading) {
    return <LoadingMessage>Loading pending prescriptions...</LoadingMessage>;
  }

  return (
    <>
    <TableContainer>
      <PrescriptionTable>
        <thead>
          <tr>
            <TableHeader>Patient Name</TableHeader>
            <TableHeader>Doctor Name</TableHeader>
            <TableHeader>Prescription Details</TableHeader>
            <TableHeader>Date Issued</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {pendingPrescriptions.length > 0 ? (
            pendingPrescriptions.map(p => (
              <TableRow 
                key={p.id}
                onClick={() => setSelectedPrescription(p)}
                clickable>
                <TableCell>{getAddress(p.patient)}</TableCell>
                <TableCell>{getAddress(p.doctor)}</TableCell>
                <TableCell>
                  <PrescriptionDetails>
                    {p.prescriptionHash.substring(0, 16)}...
                    <Tooltip>{p.prescriptionHash}</Tooltip>
                  </PrescriptionDetails>
                </TableCell>
                <TableCell>{formatDate(p.issueDate)}</TableCell>
                <TableCell>
                  <StatusSelect 
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Needs Clarification">Needs Clarification</option>
                  </StatusSelect>
                </TableCell>
                <TableCell>
                  <CompleteButton onClick={() => completeFulfillment(p.id)}>
                    Complete
                  </CompleteButton>
                  <StatusIndicator status={p.status}>
                    {p.status}
                  </StatusIndicator>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="6" style={{ textAlign: 'center' }}>
                No pending prescriptions to fulfill
              </TableCell>
            </TableRow>
          )}
        </tbody>
      </PrescriptionTable>
    </TableContainer>
    {selectedPrescription && (
        <PrescriptionDetailModal 
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </>
  );
};

// Add this new styled component
const StatusIndicator = styled.div`
  display: none; // Hide on desktop, show on mobile if needed
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch(props.status) {
      case 'Ready for Pickup': return '#d4edda';
      case 'On Hold': return '#fff3cd';
      case 'Needs Clarification': return '#f8d7da';
      default: return '#e2e3e5';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'Ready for Pickup': return '#155724';
      case 'On Hold': return '#856404';
      case 'Needs Clarification': return '#721c24';
      default: return '#383d41';
    }
  }};
  
  @media (max-width: 768px) {
    display: inline-block;
    margin-top: 8px;
  }
`;


// Styled components (reusing some from NewPrescriptionsTab)
const StatusSelect = styled.select`
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  font-size: 14px;
`;

const CompleteButton = styled.button`
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #218838;
  }
`;

const UpdateButton = styled.button`
  padding: 6px 12px;
  background-color: #ffc107;
  color: #212529;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e0a800;
  }
`;

// Styled components
const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 20px;
`;

const PrescriptionTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const TableHeader = styled.th`
  padding: 12px 15px;
  background-color: #4a90e2;
  color: white;
  text-align: left;
  font-weight: 500;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
  &:hover {
    background-color: #e9ecef;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #dee2e6;
  color: #666;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #218838;
  }
`;

const ViewButton = styled.button`
  padding: 6px 12px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #138496;
  }
`;

const PrescriptionDetails = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
  color: #666;

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = styled.span`
  visibility: hidden;
  width: 300px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  word-break: break-all;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

export default PendingFulfillmentsTab;