
import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import { getAddress } from 'ethers';

const PharmacistSettingsTab = () => {
  const { account, contracts } = useWallet();
  const [pharmacyInfo, setPharmacyInfo] = useState({
    name: '',
    address: '',
    phone: '',
    hours: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacyInfo = async () => {
      try {
        if (contracts.medicalAccess && account) {
          const pharmacist = await contracts.medicalAccess.getPharmacist(account);
          setPharmacyInfo({
            name: pharmacist.pharmacyName || '',
            address: '', // Would come from IPFS in a real app
            phone: '',  // Would come from IPFS
            hours: ''   // Would come from IPFS
          });
        }
      } catch (error) {
        console.error("Error fetching pharmacy info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyInfo();
  }, [account, contracts.medicalAccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPharmacyInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // In a real app, this would save to IPFS and update the contract
    alert('Pharmacy information updated successfully!');
    setIsEditing(false);
  };

  if (loading) {
    return <LoadingMessage>Loading pharmacy information...</LoadingMessage>;
  }

  return (
    <SettingsContainer>
      <SettingsCard>
        <SettingsHeader>
          <h3>Pharmacy Information</h3>
          {isEditing ? (
            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
          ) : (
            <EditButton onClick={() => setIsEditing(true)}>Edit Information</EditButton>
          )}
        </SettingsHeader>

        <SettingsForm>
          <FormGroup>
            <Label>Pharmacy Name</Label>
            {isEditing ? (
              <Input
                type="text"
                name="name"
                value={pharmacyInfo.name}
                onChange={handleInputChange}
              />
            ) : (
              <InfoText>{pharmacyInfo.name}</InfoText>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Pharmacy Address</Label>
            {isEditing ? (
              <Input
                type="text"
                name="address"
                value={pharmacyInfo.address}
                onChange={handleInputChange}
                placeholder="123 Main St, City, State ZIP"
              />
            ) : (
              <InfoText>{pharmacyInfo.address || 'Not specified'}</InfoText>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Phone Number</Label>
            {isEditing ? (
              <Input
                type="tel"
                name="phone"
                value={pharmacyInfo.phone}
                onChange={handleInputChange}
                placeholder="(123) 456-7890"
              />
            ) : (
              <InfoText>{pharmacyInfo.phone || 'Not specified'}</InfoText>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Business Hours</Label>
            {isEditing ? (
              <TextArea
                name="hours"
                value={pharmacyInfo.hours}
                onChange={handleInputChange}
                placeholder="Mon-Fri: 9am-9pm\nSat: 9am-5pm\nSun: Closed"
                rows="3"
              />
            ) : (
              <InfoText>
                {pharmacyInfo.hours || 'Not specified'}
              </InfoText>
            )}
          </FormGroup>
        </SettingsForm>
      </SettingsCard>
    </SettingsContainer>
  );
};

// Styled components
const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const SettingsCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 25px;
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;

  h3 {
    margin: 0;
    color: #333;
  }
`;

const EditButton = styled.button`
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #357abd;
  }
`;

const SaveButton = styled.button`
  padding: 8px 16px;
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

const SettingsForm = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  resize: vertical;
`;

const InfoText = styled.p`
  margin: 0;
  padding: 10px;
  background-color: #f8f9fa;
  color: #666;
  border-radius: 4px;
  white-space: pre-line;
`;

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

export default PharmacistSettingsTab;