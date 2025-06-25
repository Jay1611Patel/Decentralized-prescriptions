import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import { getAddress } from 'ethers';
import PrescriptionDetailModal from './PrescriptionDetailModal';

const NewPrescriptionsTab = () => {
    const { contracts } = useWallet();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctorNames, setDoctorNames] = useState({});
    const [selectedPrescription, setSelectedPrescription] = useState(null);


    useEffect(() => {
        const fetchNewPrescriptions = async () => {
            try {
                const registry = contracts.prescriptionRegistry;
                const count = await registry.getPrescriptionCount();

                const newPrescriptions = [];
                const doctorAddresses = new Set();

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
                        if (!prescription.isFulfilled && prescription.expiryDate > Math.floor(Date.now() / 1000)) {
                            newPrescriptions.push(prescription);
                            doctorAddresses.add(prescription.doctor);
                        }
                    } catch (error) {
                        console.error(`Error fetching prescription ${i}:`, error);
                    } 
                }
                const names = {};
                for (const address of doctorAddresses) {
                    try {
                        const doctor = await contracts.medicalAccess.getDoctor(address);
                        names[address] = doctor.name || 'Unknown Doctor';
                    } catch {
                        names[address] = 'Unknown Doctor';
                    }
                }

                setDoctorNames(names);
                setPrescriptions(newPrescriptions);
            } catch (error) {
                console.error("Error fetching prescriptions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNewPrescriptions();
    }, [contracts]);

    const fulfillPrescription = async (prescriptionId) => {
        try {
        const tx = await contracts.prescriptionRegistry.fulfillPrescription(prescriptionId);
        await tx.wait();
        
        // Update local state
        setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
        } catch (error) {
        console.error("Error fulfilling prescription:", error);
        alert(`Failed to fulfill prescription: ${error.message}`);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toISOString().split('T')[0];
    };

    if (loading) {
        return <LoadingMessage>Loading prescriptions...</LoadingMessage>;
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
                <TableHeader>Actions</TableHeader>
            </tr>
            </thead>
            <tbody>
            {prescriptions.length > 0 ? (
                prescriptions.map(p => {
                    return (
                    <TableRow 
                    key={p.id}
                    onClick={() => setSelectedPrescription(p)}
                    clickable>
                        <TableCell>{getAddress(p.patient)}</TableCell>
                        <TableCell>{doctorNames[p.doctor] || 'Unknown Doctor'}</TableCell>
                        <TableCell>
                        <PrescriptionDetails>
                            {p.prescriptionHash.substring(0, 16)}...
                            <Tooltip>{p.prescriptionHash}</Tooltip>
                        </PrescriptionDetails>
                        </TableCell>
                        <TableCell>{formatDate(p.issueDate)}</TableCell>
                        <TableCell>
                        <ActionButton onClick={() => fulfillPrescription(p.id)}>
                            Fulfill
                        </ActionButton>
                        <ViewButton onClick={() => window.alert(`Full prescription hash: ${p.prescriptionHash}`)}>
                            View
                        </ViewButton>
                        </TableCell>
                    </TableRow>
                    );
                })
                ) : (
                <TableRow>
                    <TableCell colSpan="5" style={{ textAlign: 'center' }}>
                    No new prescriptions available
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
}

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

export default NewPrescriptionsTab;

