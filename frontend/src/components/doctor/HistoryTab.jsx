import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  HistoryContainer,
  FilterControls,
  Select,
  HistoryList,
  HistoryItem,
  EmptyState,
  PaginationControls
} from '../styles/DoctorHistoryStyles';

const HistoryTab = () => {
  const { account, contract, contracts } = useWallet();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    timeFrame: 'all',
    sortBy: 'newest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadPrescriptionHistory = async () => {
      if (!contracts.prescriptionRegistry || !account) return;
      
      setLoading(true);
      setError('');
      
      try {
        const prescriptionIds = await contracts.prescriptionRegistry.getDoctorPrescriptions(account);
        console.log(prescriptionIds);
        
        const prescriptionData = await Promise.all(
          prescriptionIds.map(async id => {
            const prescription = await contracts.prescriptionRegistry.getPrescription(id);
            return {
              id: id.toString(),
              ...prescription
            };
          })
        );
        
        // Sort by newest first by default
        prescriptionData.sort((a, b) => b.issueDate - a.issueDate);
        setPrescriptions(prescriptionData);
      } catch (err) {
        setError('Failed to load prescription history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptionHistory();
  }, [contracts.prescriptionRegistry, account]);

  const applyFilters = () => {
    let filtered = [...prescriptions];
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => 
        filters.status === 'fulfilled' ? p.isFulfilled : !p.isFulfilled
      );
    }
    
    // Apply time frame filter
    if (filters.timeFrame !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      let cutoff;
      
      switch (filters.timeFrame) {
        case 'week':
          cutoff = now - (7 * 86400);
          break;
        case 'month':
          cutoff = now - (30 * 86400);
          break;
        case 'year':
          cutoff = now - (365 * 86400);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(p => p.issueDate >= cutoff);
    }
    
    // Apply sorting
    if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => a.issueDate - b.issueDate);
    } else if (filters.sortBy === 'expiring') {
      filtered.sort((a, b) => a.expiryDate - b.expiryDate);
    } else {
      filtered.sort((a, b) => b.issueDate - a.issueDate);
    }
    
    return filtered;
  };

  const filteredPrescriptions = applyFilters();
  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);
  const paginatedItems = filteredPrescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <EmptyState>Loading history...</EmptyState>;
  }

  if (error) {
    return <EmptyState>{error}</EmptyState>;
  }

  return (
    <HistoryContainer>
      <FilterControls>
        <div>
          <label>Status:</label>
          <Select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="active">Active</option>
          </Select>
        </div>
        
        <div>
          <label>Time Frame:</label>
          <Select
            value={filters.timeFrame}
            onChange={(e) => setFilters({...filters, timeFrame: e.target.value})}
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </Select>
        </div>
        
        <div>
          <label>Sort By:</label>
          <Select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="expiring">Expiring Soonest</option>
          </Select>
        </div>
      </FilterControls>
      
      {filteredPrescriptions.length === 0 ? (
        <EmptyState>No prescriptions match your filters</EmptyState>
      ) : (
        <>
          <HistoryList>
            {paginatedItems.map(prescription => (
              <HistoryItem key={prescription.id}>
                <div>
                  <h4>Prescription #{prescription.id}</h4>
                  <p><strong>Patient:</strong> {prescription.patient}</p>
                  <p><strong>Issued:</strong> {formatDate(prescription.issueDate)}</p>
                </div>
                <div>
                  <p><strong>Status:</strong> 
                    <span style={{ 
                      color: prescription.isFulfilled ? 'green' : 'orange',
                      fontWeight: 'bold'
                    }}>
                      {prescription.isFulfilled ? ' Fulfilled' : ' Active'}
                    </span>
                  </p>
                  <p><strong>Expires:</strong> {formatDate(prescription.expiryDate)}</p>
                  {prescription.isFulfilled && (
                    <p><strong>Fulfilled by:</strong> {prescription.fulfilledBy}</p>
                  )}
                </div>
              </HistoryItem>
            ))}
          </HistoryList>
          
          {totalPages > 1 && (
            <PaginationControls>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </PaginationControls>
          )}
        </>
      )}
    </HistoryContainer>
  );
};

export default HistoryTab;