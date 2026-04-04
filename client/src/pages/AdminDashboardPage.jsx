import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api, attachToken } from "../api/client";
import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  const authConfig = attachToken(admin?.token);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/admin/dashboard", authConfig);
      setDashboard(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load admin dashboard");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status }, authConfig);
      toast.success(`User updated to ${status}`);
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update user");
    }
  };

  return (
    <AppShell
      title="Admin Command Center"
      subtitle="Full visibility into users, short URLs, analytics, and account controls."
      role="ADMIN"
      onLogout={() => {
        logout("ADMIN");
        navigate("/admin/login");
      }}
    >
      <section className="stats-grid">
        <StatCard label="Total users" value={dashboard?.totalUsers || 0} hint="All registered user accounts" />
        <StatCard label="Active users" value={dashboard?.activeUsers || 0} hint="Users currently allowed to log in" />
        <StatCard label="Blocked users" value={dashboard?.blockedUsers || 0} hint="Accounts disabled by admin" />
        <StatCard label="Total clicks" value={dashboard?.totalClicks || 0} hint="System-wide redirect traffic" />
      </section>

      <section className="dashboard-grid dashboard-grid--admin">
        <div className="panel">
          <div className="panel__header">
            <h2>Users</h2>
            <span>{dashboard?.users?.length || 0} accounts</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Links</th>
                  <th>Clicks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.users || []).map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.status}</td>
                    <td>{user.emailVerified ? "Yes" : "No"}</td>
                    <td>{user.createdLinks}</td>
                    <td>{user.totalClicks}</td>
                    <td className="table__actions">
                      <button className="link-button" onClick={() => updateStatus(user.id, "ACTIVE")}>
                        Activate
                      </button>
                      <button className="link-button" onClick={() => updateStatus(user.id, "INACTIVE")}>
                        Deactivate
                      </button>
                      <button className="link-button link-button--danger" onClick={() => updateStatus(user.id, "BLOCKED")}>
                        Block
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <h2>Links overview</h2>
            <span>{dashboard?.links?.length || 0} short URLs</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Clicks</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.links || []).map((link) => (
                  <tr key={link.id}>
                    <td>{link.title}</td>
                    <td>{link.ownerName}</td>
                    <td>{link.ownerEmail}</td>
                    <td>{link.shortUrl}</td>
                    <td>{link.active ? "Active" : "Inactive"}</td>
                    <td>{link.clickCount}</td>
                    <td>{link.expiresAt ? new Date(link.expiresAt).toLocaleString() : "No expiry"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default AdminDashboardPage;
