import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import PatientCard from '../doctor/PatientCard';
import PatientSearch from '../doctor/PatientSearch';

const PatientManagement = () => {
    const { contract, account } = useWallet();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    
}

export default PatientManagement;