import { Navigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { account, role, loading } = useWallet();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;