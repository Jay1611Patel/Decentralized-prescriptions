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
  const { account, contracts, getPatientData } = useWallet();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientNames, setPatientNames] = useState({});
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
      if (!contracts?.prescriptionRegistry || !contracts?.medicalAccess || !account) return;

      setLoading(true);
      setError('');

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

        // Sort prescriptions
        data.sort((a, b) => b.issueDate - a.issueDate);
        setPrescriptions(data);

        // Resolve names
        const uniqueAddresses = [...new Set(data.map(p => p.patient))];
        const names = {};

        for (const address of uniqueAddresses) {
          try {
            const cid = await contracts.medicalAccess.getPatientCID(address);
            if (!cid) {
              names[address] = `Patient (${address.slice(0, 6)}...${address.slice(-4)})`;
              continue;
            }

            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            const json = await response.json();
            names[address] = json.name || `Patient (${address.slice(0, 6)}...${address.slice(-4)})`;
          } catch (err) {
            console.error(`Error resolving name for ${address}:`, err);
            names[address] = `Patient (${address.slice(0, 6)}...${address.slice(-4)})`;
          }
        }

        setPatientNames(names);
      } catch (err) {
        setError('Failed to load prescription history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptionHistory();
  }, [contracts, account]);

  const applyFilters = () => {
    let filtered = [...prescriptions];

    if (filters.status !== 'all') {
      filtered = filtered.filter(p =>
        filters.status === 'fulfilled' ? p.isFulfilled : !p.isFulfilled
      );
    }

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

  if (loading) return <EmptyState>Loading history...</EmptyState>;
  if (error) return <EmptyState>{error}</EmptyState>;

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
            {paginatedItems.map(p => (
              <HistoryItem key={p.id}>
                <div>
                  <h4>Prescription #{p.id}</h4>
                  <p><strong>Patient:</strong> {patientNames[p.patient] || p.patient}</p>
                  <p><strong>Issued:</strong> {formatDate(p.issueDate)}</p>
                </div>
                <div>
                  <p><strong>Status:</strong>
                    <span style={{
                      color: p.isFulfilled ? 'green' : 'orange',
                      fontWeight: 'bold'
                    }}>
                      {p.isFulfilled ? ' Fulfilled' : ' Active'}
                    </span>
                  </p>
                  <p><strong>Expires:</strong> {formatDate(p.expiryDate)}</p>
                  {p.isFulfilled && (
                    <p><strong>Fulfilled by:</strong> {p.fulfilledBy}</p>
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
