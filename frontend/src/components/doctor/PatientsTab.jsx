import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  PatientListContainer,
  PatientCard,
  PatientHeader,
  PatientDetails,
  AccessInfo,
  DataFields,
  ActionButton,
  SearchBar,
  EmptyState
} from '../styles/DoctorPatientsStyles';

const PatientsTab = () => {
  const { account, contract, contracts, getPatientData } = useWallet();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatientAccess = async () => {
      if (!contracts.medicalAccess || !account) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Get all active permissions where this doctor has access
        const activePermissions = await contracts.medicalAccess.getDoctorAccess();
        
        // Get unique patient addresses
        const patientAddresses = [...new Set(
          activePermissions.map(p => p.patient)
        )];
        
        // Fetch patient data for each
        const patientData = await Promise.all(
          patientAddresses.map(async address => {
            try {
              const cid = await contracts.medicalAccess.getPatientCID(address);
              if (!cid) return null;
              
              const data = await getPatientData(cid);
              return { address, data };
            } catch (err) {
              console.error(`Failed to fetch patient ${address}:`, err);
              return null;
            }
          })
        );
        
        setPatients(patientData.filter(p => p !== null));
      } catch (err) {
        setError('Failed to load patient data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPatientAccess();
  }, [contracts.medicalAccess, account, getPatientData]);

  const filteredPatients = patients.filter(patient => 
    patient.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <EmptyState>Loading patient data...</EmptyState>;
  }

  if (error) {
    return <EmptyState>{error}</EmptyState>;
  }

  if (patients.length === 0) {
    return (
      <EmptyState>
        No patients have granted you access yet.
      </EmptyState>
    );
  }

  return (
    <PatientListContainer>
      <SearchBar
        type="text"
        placeholder="Search patients by name or address..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {filteredPatients.map(patient => (
        <PatientCard key={patient.address}>
          <PatientHeader>
            <h3>{patient.data.name || 'Unnamed Patient'}</h3>
            <small>{patient.address}</small>
          </PatientHeader>
          
          <PatientDetails>
            <div>
              <p><strong>DOB:</strong> {patient.data.dob || 'Not provided'}</p>
              <p><strong>Contact:</strong> {patient.data.contactInfo || 'Not provided'}</p>
            </div>
            
            <AccessInfo>
              <DataFields>
                <strong>Access to:</strong> Medical Records, Prescriptions
              </DataFields>
              <p><strong>Access expires:</strong> Indefinite</p>
            </AccessInfo>
          </PatientDetails>
          
          <ActionButton>
            View Full Profile
          </ActionButton>
        </PatientCard>
      ))}
    </PatientListContainer>
  );
};

export default PatientsTab;