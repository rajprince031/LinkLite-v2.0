import axios from "axios";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Loader from "../component/Loader";

function AdminAuthRoute() {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const adminAuthToken = localStorage.getItem("adminAuthToken");

  useEffect(() => {
    if (!adminAuthToken) {
      navigate("/admin/login", { replace: true });
      return;
    }
    axios.get(`${LOCALHOST_API}/auth/me`, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
      },
    }).then((res) => {
      if (res.data.role !== "ADMIN") {
        localStorage.removeItem("adminAuthToken");
        navigate("/admin/login", { replace: true });
        return;
      }
      setIsLoading(false);
    }).catch(() => {
      localStorage.removeItem("adminAuthToken");
      navigate("/admin/login", { replace: true });
    });
  }, [LOCALHOST_API, adminAuthToken, navigate]);

  return isLoading ? <Loader /> : <Outlet />;
}

export default AdminAuthRoute;
