import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import { getAddress } from 'ethers';
import PrescriptionDetailModal from './PrescriptionDetailModal';

const FulfillmentHistoryTab = () => {
    const { contracts } = useWallet();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPrescription, setSelectedPrescription] = useState(null);


    useEffect(() => {
        const fetchFulfillmentHistory = async () => {
            try {
                const registry = contracts.prescriptionRegistry;
                const count = await registry.getPrescriptionCount();

                const fulfilled = [];

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
                        };
                        if (prescription.isFulfilled) {
                            fulfilled.push(prescription);
                        }
                    } catch (error) {
                        console.error(`Error fetching prescription ${i}:`, error);
                    }
                }

                setHistory(fulfilled);
            } catch (error) {
                console.error("Error fetching fulfillment history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFulfillmentHistory();
    }, [contracts]);

    const filteredHistory = history.filter(p => {
        const matchesFilter = filter === 'all' || 
                         (filter === 'recent' && p.fulfillmentDate > Date.now()/1000 - 2592000) || // Last 30 days
                         (filter === 'expired' && p.expiryDate < Date.now()/1000);
        const matchesSearch = searchTerm === '' || 
                         p.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.prescriptionHash.toLowerCase().includes(searchTerm.toLowerCase());
    
        return matchesFilter && matchesSearch;
    });

    const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    if (loading) {
        return <LoadingMessage>Loading fulfillment history...</LoadingMessage>;
    }

    return (
        <HistoryContainer>
        <FiltersContainer>
            <FilterGroup>
            <FilterLabel>Filter by:</FilterLabel>
            <FilterSelect 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="all">All Fulfillments</option>
                <option value="recent">Last 30 Days</option>
                <option value="expired">Expired Prescriptions</option>
            </FilterSelect>
            </FilterGroup>
            
            <SearchGroup>
            <SearchInput
                type="text"
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </SearchGroup>
        </FiltersContainer>

        <TableContainer>
            <HistoryTable>
            <thead>
                <tr>
                <TableHeader>Patient Name</TableHeader>
                <TableHeader>Doctor Name</TableHeader>
                <TableHeader>Prescription Details</TableHeader>
                <TableHeader>Date Issued</TableHeader>
                <TableHeader>Fulfilled On</TableHeader>
                </tr>
            </thead>
            <tbody>
                {filteredHistory.length > 0 ? (
                filteredHistory.map(p => (
                    <TableRow key={p.id}
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
                    <TableCell>{formatDate(p.fulfillmentDate)}</TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan="5" style={{ textAlign: 'center' }}>
                    No matching fulfillment records found
                    </TableCell>
                </TableRow>
                )}
            </tbody>
            </HistoryTable>
        </TableContainer>
        {selectedPrescription && (
            <PrescriptionDetailModal 
            prescription={selectedPrescription}
            onClose={() => setSelectedPrescription(null)}
            />
        )}
        </HistoryContainer>
    );
}


// Styled components
const HistoryContainer = styled.div`
  margin-top: 20px;
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const FilterLabel = styled.label`
  margin-right: 10px;
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ced4da;
`;

const SearchGroup = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  min-width: 250px;
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
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

export default FulfillmentHistoryTab;