import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import styled from 'styled-components';
import { ethers } from 'ethers';
import PharmacistHeader from '../pharmacist/PharmacistHeader';
import NewPrescriptionsTab from '../pharmacist/NewPrescriptionsTab';
import PendingFulfillmentsTab from '../pharmacist/PendingFulfillmentsTab';
import FulfillmentHistoryTab from '../pharmacist/FulfillmentHistoryTab';
import PharmacistSettingsTab from '../pharmacist/PharmacistSettingsTab';

const PharmacistDashboard = () => {
  const [activeTab, setActiveTab] = useState('new');

  const renderTab = () => {
    switch (activeTab) {
      case 'new':
        return <NewPrescriptionsTab />;
      case 'pending':
        return <PendingFulfillmentsTab />;
      case 'history':
        return <FulfillmentHistoryTab />;
      case 'settings':
        return <PharmacistSettingsTab />;
      default:
        return <NewPrescriptionsTab />;
    }
  };

  return (
    <DashboardContainer>
      <PharmacistHeader />
      
      <TabContainer>
        <TabButton 
          active={activeTab === 'new'} 
          onClick={() => setActiveTab('new')}
        >
          New Prescriptions
        </TabButton>
        <TabButton 
          active={activeTab === 'pending'} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Fulfillments
        </TabButton>
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
        >
          Fulfillment History
        </TabButton>
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </TabButton>
      </TabContainer>

      <TabContent>
        {renderTab()}
      </TabContent>
    </DashboardContainer>
  );
};

// Styled components
const DashboardContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  margin-right: 10px;
  background: ${props => props.active ? '#4a90e2' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#4a90e2' : '#f0f0f0'};
  }
`;

const TabContent = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
`;

export default PharmacistDashboard;