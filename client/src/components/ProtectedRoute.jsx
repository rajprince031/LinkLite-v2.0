import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ role, children }) => {
  const location = useLocation();
  const { user, admin } = useAuth();
  const auth = role === "ADMIN" ? admin : user;

  if (!auth?.token || auth?.profile?.role !== role) {
    return <Navigate to={role === "ADMIN" ? "/admin/login" : "/login"} replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
