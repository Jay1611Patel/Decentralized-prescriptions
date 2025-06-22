import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  RefillsContainer,
  RefillList,
  RefillItem,
  RefillDetails,
  ActionButtons,
  ApproveButton,
  DenyButton,
  EmptyState,
  FilterControls,
  Select
} from '../styles/DoctorRefillStyles';

const RefillsTab = () => {
  const { account, contract } = useWallet();
  const [refillRequests, setRefillRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);

  // Mock data - in a real app, this would come from your contract
  const mockRefills = [
    {
      id: '1',
      prescriptionId: '101',
      patient: '0x123...abc',
      patientName: 'John Doe',
      medication: 'Lisinopril 10mg',
      requestedOn: Date.now() - 86400000, // 1 day ago
      status: 'pending',
      originalPrescriptionDate: Date.now() - 2592000000 // 30 days ago
    },
    {
      id: '2',
      prescriptionId: '102',
      patient: '0x456...def',
      patientName: 'Jane Smith',
      medication: 'Atorvastatin 20mg',
      requestedOn: Date.now() - 172800000, // 2 days ago
      status: 'pending',
      originalPrescriptionDate: Date.now() - 3456000000 // 40 days ago
    },
    {
      id: '3',
      prescriptionId: '103',
      patient: '0x789...ghi',
      patientName: 'Robert Johnson',
      medication: 'Metformin 500mg',
      requestedOn: Date.now() - 604800000, // 7 days ago
      status: 'approved',
      originalPrescriptionDate: Date.now() - 5184000000 // 60 days ago
    }
  ];

  useEffect(() => {
    // In a real implementation, this would fetch from your contract
    const loadRefillRequests = async () => {
      setLoading(true);
      setError('');
      
      try {
        // TODO: Replace with actual contract calls
        // const requests = await contract.getRefillRequests(account);
        // setRefillRequests(requests);
        
        // Using mock data for now
        setRefillRequests(mockRefills);
      } catch (err) {
        setError('Failed to load refill requests');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRefillRequests();
  }, [account, contract]);

  const handleApprove = async (requestId) => {
    setProcessing(requestId);
    try {
      // TODO: Implement contract interaction
      // await contract.approveRefill(requestId);
      
      // Update local state
      setRefillRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
      
      // In a real app, you might want to refresh the data
    } catch (err) {
      setError('Failed to approve refill');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (requestId) => {
    setProcessing(requestId);
    try {
      // TODO: Implement contract interaction
      // await contract.denyRefill(requestId);
      
      // Update local state
      setRefillRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'denied' } : req
      ));
    } catch (err) {
      setError('Failed to deny refill');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = refillRequests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <EmptyState>Loading refill requests...</EmptyState>;
  }

  if (error) {
    return <EmptyState>{error}</EmptyState>;
  }

  return (
    <RefillsContainer>
      <FilterControls>
        <label>Show:</label>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pending">Pending Only</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="all">All Requests</option>
        </Select>
      </FilterControls>
      
      {filteredRequests.length === 0 ? (
        <EmptyState>No refill requests found</EmptyState>
      ) : (
        <RefillList>
          {filteredRequests.map(request => (
            <RefillItem key={request.id} status={request.status}>
              <RefillDetails>
                <h4>Refill for {request.patientName}</h4>
                <p><strong>Medication:</strong> {request.medication}</p>
                <p><strong>Original Prescription:</strong> {formatDate(request.originalPrescriptionDate)}</p>
                <p><strong>Requested On:</strong> {formatDate(request.requestedOn)}</p>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    color: request.status === 'approved' ? 'green' : 
                          request.status === 'denied' ? 'red' : 'orange',
                    fontWeight: 'bold'
                  }}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </p>
              </RefillDetails>
              
              {request.status === 'pending' && (
                <ActionButtons>
                  <ApproveButton 
                    onClick={() => handleApprove(request.id)}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? 'Processing...' : 'Approve'}
                  </ApproveButton>
                  <DenyButton 
                    onClick={() => handleDeny(request.id)}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? 'Processing...' : 'Deny'}
                  </DenyButton>
                </ActionButtons>
              )}
            </RefillItem>
          ))}
        </RefillList>
      )}
    </RefillsContainer>
  );
};

export default RefillsTab;