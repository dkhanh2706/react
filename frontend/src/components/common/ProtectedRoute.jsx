import { getAuth } from "../../utils/auth.js";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();

  const { token, user } = getAuth();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin =
    user?.role === "ADMIN";

  // Route yêu cầu ADMIN nhưng user không phải ADMIN
  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;
