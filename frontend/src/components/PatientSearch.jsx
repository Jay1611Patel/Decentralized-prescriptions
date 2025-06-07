import { useState } from 'react';
import styled from 'styled-components';
import { useWallet } from '../context/WalletContext';

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
`;

const SearchButton = styled.button`
  background-color: #4c51bf;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #434190;
  }
`;

const ResultsList = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const PatientItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f7fafc;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const PatientSearch = ({ onSelectPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { contract } = useWallet();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate searching patients (in a real app, you would query the blockchain)
      const mockResults = [
        { address: '0x123...456', name: 'John Doe' },
        { address: '0x789...012', name: 'Jane Smith' }
      ].filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search by patient name or address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchButton onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </SearchButton>
      </SearchContainer>

      {searchResults.length > 0 && (
        <ResultsList>
          {searchResults.map((patient, index) => (
            <PatientItem 
              key={index} 
              onClick={() => onSelectPatient(patient.address)}
            >
              <strong>{patient.name}</strong>
              <div>{patient.address}</div>
            </PatientItem>
          ))}
        </ResultsList>
      )}
    </div>
  );
};

export default PatientSearch;