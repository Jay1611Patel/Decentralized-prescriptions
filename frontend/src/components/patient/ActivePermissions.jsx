import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';

const PermissionsContainer = styled.div`
  margin-top: 20px;
`;

const PermissionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const PermissionItem = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: white;
`;

const PermissionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const DoctorName = styled.div`
  font-weight: 500;
  color: #1976d2;
`;

const PermissionStatus = styled.div`
  color: #666;
  font-size: 14px;
`;

const PermissionDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DataFields = styled.div`
  color: #333;
  font-size: 14px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ExtendButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #388e3c;
  }

  &:disabled {
    background: #a5d6a7;
    cursor: not-allowed;
  }
`;

const RevokeButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #d32f2f;
  }

  &:disabled {
    background: #ef9a9a;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background: #fde7e7;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const ActivePermissions = ({ permissions, onRevoke, onExtend }) => {
  const { revokeAccessEarly, extendAccess, contract, contracts } = useWallet();
  const [doctorInfo, setDoctorInfo] = useState({});
  const [extendingId, setExtendingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState('');

  const formatDate = (timestamp) => {
    if (timestamp > 3000000000) return 'Indefinite';
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  useEffect(() => {
    const fetchDoctorData = async () => {
      const entries = await Promise.all(
        permissions.map(async (perm) => {
          try {
            const [_, __, name, specialization] = await contracts.medicalAccess.getDoctor(perm.doctor); // or perm[1]
            return [perm.doctor, { name, specialization }];
          } catch (err) {
            console.warn('Failed to fetch doctor data for', perm.doctor, err);
            return [perm.doctor, { name: 'Unknown Doctor', specialization: '' }];
          }
        })
      );
      setDoctorInfo(Object.fromEntries(entries));
    };

    if (permissions.length) fetchDoctorData();
  }, [permissions, contracts.medicalAccess]);

  const handleExtend = async (requestId, doctor) => {
    setExtendingId(requestId);
    setError('');
    try {
      await extendAccess(requestId, doctor, 604800); // Extend by 1 week
      onExtend();
    } catch (err) {
      setError(err.message);
    } finally {
      setExtendingId(null);
    }
  };

  const handleRevoke = async (requestId, doctor) => {
    setRevokingId(requestId);
    setError('');
    try {
      await revokeAccessEarly(requestId, doctor);
      onRevoke();
    } catch (err) {
      setError(err.message);
    } finally {
      setRevokingId(null);
    }
  };

  if (!permissions || permissions.length === 0) {
    return (
      <EmptyState>
        <p>No active permissions found</p>
      </EmptyState>
    );
  }

  return (
    <PermissionsContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <PermissionsList>
        {permissions.map((perm) => {
          const doctor = doctorInfo[perm.doctor];
          return (
            <PermissionItem key={perm.requestId}>
              <PermissionHeader>
                <DoctorName>
                  {doctor?.name || 'Unknown Doctor'}
                  {doctor?.specialization && ` (${doctor.specialization})`}
                </DoctorName>
                <PermissionStatus>
                  {perm.isActive ? (
                    `Expires: ${formatDate(Number(perm.expiryTime))}`
                  ) : (
                    <span style={{ color: 'red' }}>Revoked</span>
                  )}
                </PermissionStatus>
              </PermissionHeader>

              <PermissionDetails>
                <DataFields>
                  <strong>Access to:</strong> {perm.dataFields?.join(', ') || 'All data'}
                </DataFields>

                <ActionButtons>
                  <ExtendButton 
                    onClick={() => handleExtend(perm.requestId, perm.doctor)}
                    disabled={!perm.isActive || extendingId === perm.requestId}
                  >
                    {extendingId === perm.requestId ? 'Extending...' : 'Extend'}
                  </ExtendButton>
                  
                  <RevokeButton 
                    onClick={() => handleRevoke(perm.requestId, perm.doctor)}
                    disabled={!perm.isActive || revokingId === perm.requestId}
                  >
                    {revokingId === perm.requestId ? 'Revoking...' : 'Revoke'}
                  </RevokeButton>
                </ActionButtons>
              </PermissionDetails>
            </PermissionItem>
          );
        })}
      </PermissionsList>
    </PermissionsContainer>
  );
};

export default ActivePermissions;