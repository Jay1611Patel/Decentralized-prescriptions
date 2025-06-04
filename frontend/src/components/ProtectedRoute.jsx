import { useWallet } from '../context/WalletContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { account, role, loading } = useWallet();

  if (loading) {
    return <div>Loading...</div>; // Or your custom loader
  }

  if (!account) {
    return <Navigate to="/" replace />;
  }

  // Convert allowedRoles to array if it's not already
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;