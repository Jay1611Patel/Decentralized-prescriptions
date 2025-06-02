import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Login from './components/Login';
import AdminDashboard from './components/dashboards/AdminDashboard';
import DoctorDashboard from './components/dashboards/DoctorDashboard';
import PharmacistDashboard from './components/dashboards/PharmacistDashboard';
import PatientDashboard from './components/dashboards/PatientDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />}/>

          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/doctor-dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/pharmacist-dashboard" element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/patient-dashboard" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }/>
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;