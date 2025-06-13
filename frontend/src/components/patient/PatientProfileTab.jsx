import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';

// Styled components
const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  color: #1976d2;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-color: #333;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 30px;
`;

const SaveButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #1565c0;
  }

  &:disabled {
    background: #b0bec5;
    cursor: not-allowed;
  }
`;

const EditButton = styled.button`
  background: #f5f5f5;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background: #fde7e7;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  color: #388e3c;
  background: #edf7ed;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const PatientProfileTab = () => {
  const { account, getPatientCID, storePatientData } = useWallet();
  const [profile, setProfile] = useState({
    name: '',
    dob: '',
    contactInfo: '',
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load patient data
  useEffect(() => {
    const loadProfile = async () => {
        try {
        setIsLoading(true);
        const cid = await getPatientCID(account);
        
        if (cid && cid !== '') {
            // Try multiple IPFS gateways
            const gateways = [
            `https://ipfs.io/ipfs/${cid}`,
            `https://${cid}.ipfs.dweb.link`,
            `https://cloudflare-ipfs.com/ipfs/${cid}`
            ];

            let data;
            for (const gateway of gateways) {
            try {
                const response = await fetch(gateway);
                if (response.ok) {
                data = await response.json();
                break;
                }
            } catch (e) {
                console.warn(`Failed with gateway ${gateway}:`, e);
            }
            }

            if (!data) throw new Error('All IPFS gateways failed');

            // Transform data based on structure
            const profileData = data.personalInfo ? {
            ...data.personalInfo,
            ...data.medicalInfo
            } : data; // Support both old and new formats

            setProfile({
            name: profileData.name || '',
            dob: profileData.dob || '',
            contactInfo: profileData.contactInfo || '',
            bloodType: profileData.bloodType || '',
            allergies: profileData.allergies || '',
            medications: profileData.medications || '',
            conditions: profileData.conditions || ''
            });
        }
        } catch (err) {
        console.error("Failed to load profile:", err);
        setError('Failed to load profile data');
        } finally {
        setIsLoading(false);
        }
    };

    if (account) loadProfile();
    }, [account, getPatientCID]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Add this to your PatientProfileTab component
  const handleSave = async () => {
    try {
        setIsLoading(true);
        setError('');
        setSuccess('');

        // Validate required fields
        if (!profile.name || !profile.dob) {
        throw new Error('Name and date of birth are required');
        }

        // Prepare data with versioning
        const profileData = {
        version: '2.0',
        lastUpdated: new Date().toISOString(),
        personalInfo: {
            name: profile.name,
            dob: profile.dob,
            contactInfo: profile.contactInfo
        },
        medicalInfo: {
            bloodType: profile.bloodType,
            allergies: profile.allergies,
            medications: profile.medications,
            conditions: profile.conditions
        }
        };

        // Store to IPFS and blockchain
        const cid = await storePatientData(profileData);
        
        // Verify retrieval immediately
        const verifyResponse = await fetch(`https://ipfs.io/ipfs/${cid}`);
        const verifiedData = await verifyResponse.json();
        
        if (!verifiedData.version) {
        throw new Error('Data verification failed');
        }

        setSuccess('Profile saved successfully!');
        setIsEditing(false);
    } catch (err) {
        setError(err.message || 'Failed to save profile');
    } finally {
        setIsLoading(false);
    }
    };

  if (isLoading) {
    return <ProfileContainer>Loading profile data...</ProfileContainer>;
  }

  return (
    <ProfileContainer>
      <SectionTitle>Personal Information</SectionTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <FormGroup>
        <Label>Full Name</Label>
        {isEditing ? (
          <Input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleInputChange}
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.name || 'Not provided'}</div>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Date of Birth</Label>
        {isEditing ? (
          <Input
            type="date"
            name="dob"
            value={profile.dob}
            onChange={handleInputChange}
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.dob || 'Not provided'}</div>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Contact Information</Label>
        {isEditing ? (
          <Input
            type="text"
            name="contactInfo"
            value={profile.contactInfo}
            onChange={handleInputChange}
            placeholder="Phone or email"
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.contactInfo || 'Not provided'}</div>
        )}
      </FormGroup>

      <SectionTitle>Medical Information</SectionTitle>

      <FormGroup>
        <Label>Blood Type</Label>
        {isEditing ? (
          <Input
            type="text"
            name="bloodType"
            value={profile.bloodType}
            onChange={handleInputChange}
            placeholder="e.g. O+"
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.bloodType || 'Not provided'}</div>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Allergies</Label>
        {isEditing ? (
          <TextArea
            name="allergies"
            value={profile.allergies}
            onChange={handleInputChange}
            placeholder="List any allergies"
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.allergies || 'None reported'}</div>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Current Medications</Label>
        {isEditing ? (
          <TextArea
            name="medications"
            value={profile.medications}
            onChange={handleInputChange}
            placeholder="List current medications"
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.medications || 'None reported'}</div>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Medical Conditions</Label>
        {isEditing ? (
          <TextArea
            name="conditions"
            value={profile.conditions}
            onChange={handleInputChange}
            placeholder="List any chronic conditions"
          />
        ) : (
          <div style={{ color: '#555' }}>{profile.conditions || 'None reported'}</div>
        )}
      </FormGroup>

      <ButtonGroup>
        {isEditing ? (
          <>
            <SaveButton onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </SaveButton>
            <EditButton onClick={() => setIsEditing(false)}>
              Cancel
            </EditButton>
          </>
        ) : (
          <EditButton onClick={() => setIsEditing(true)}>
            Edit Profile
          </EditButton>
        )}
      </ButtonGroup>
    </ProfileContainer>
  );
};

export default PatientProfileTab;