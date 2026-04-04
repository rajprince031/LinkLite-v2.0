import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api, attachToken } from "../api/client";
import AppShell from "../components/AppShell";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
  title: "",
  targetUrl: "",
  customAlias: "",
  active: true,
  expiresAt: "",
};

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, refreshProfile } = useAuth();
  const [links, setLinks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    email: user?.profile?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

  const authConfig = attachToken(user?.token);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const response = await api.get("/links", authConfig);
      setLinks(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  useEffect(() => {
    setProfileForm({
      firstName: user?.profile?.firstName || "",
      lastName: user?.profile?.lastName || "",
      email: user?.profile?.email || "",
    });
  }, [user?.profile]);

  const totals = useMemo(
    () => ({
      totalLinks: links.length,
      activeLinks: links.filter((item) => item.active).length,
      totalClicks: links.reduce((sum, item) => sum + item.clickCount, 0),
    }),
    [links]
  );

  const createLink = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const response = await api.post("/links", payload, authConfig);
      setLinks((current) => [response.data, ...current]);
      setForm(initialForm);
      setOpen(false);
      toast.success("Short link created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create link");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id, active) => {
    try {
      const response = await api.patch(`/links/${id}/status`, { active: !active }, authConfig);
      setLinks((current) => current.map((item) => (item.id === id ? response.data : item)));
      toast.success(`Link ${!active ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update link");
    }
  };

  const deleteLink = async (id) => {
    try {
      await api.delete(`/links/${id}`, authConfig);
      setLinks((current) => current.filter((item) => item.id !== id));
      toast.success("Link deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete link");
    }
  };

  const exportAnalytics = async (id, format) => {
    try {
      const response = await api.get(`/links/${id}/export?format=${format}`, authConfig);
      const binary = atob(response.data.base64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: format === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `linklite-analytics-${id}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Export failed");
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await api.patch("/users/me", profileForm, authConfig);
      await refreshProfile("USER");
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      const response = await api.patch("/users/me/password", passwordForm, authConfig);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to change password");
    }
  };

  return (
    <AppShell
      title={`Welcome back, ${user?.profile?.firstName || "User"}`}
      subtitle="Create, monitor, secure, and export your short-link data from one place."
      role="USER"
      onLogout={() => {
        logout("USER");
        navigate("/login");
      }}
      actions={
        <button className="primary-button" onClick={() => setOpen(true)}>
          New short link
        </button>
      }
    >
      <section className="stats-grid">
        <StatCard label="Total links" value={totals.totalLinks} hint="All short links in your workspace" />
        <StatCard label="Active links" value={totals.activeLinks} hint="Currently available for redirecting" />
        <StatCard label="Total clicks" value={totals.totalClicks} hint="Combined traffic across all links" />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel__header">
            <h2>Your links</h2>
            <span>{loading ? "Loading..." : `${links.length} items`}</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Short URL</th>
                  <th>Alias</th>
                  <th>Clicks</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>{link.title}</td>
                    <td>
                      <a href={link.shortUrl} target="_blank" rel="noreferrer">
                        {link.shortUrl}
                      </a>
                    </td>
                    <td>{link.customAlias || link.shortCode}</td>
                    <td>{link.clickCount}</td>
                    <td>{link.active ? "Active" : "Inactive"}</td>
                    <td>{link.expiresAt ? new Date(link.expiresAt).toLocaleString() : "No expiry"}</td>
                    <td className="table__actions">
                      <button className="link-button" onClick={() => navigate(`/dashboard/links/${link.id}`)}>
                        Details
                      </button>
                      <button className="link-button" onClick={() => toggleStatus(link.id, link.active)}>
                        {link.active ? "Disable" : "Enable"}
                      </button>
                      <button className="link-button" onClick={() => exportAnalytics(link.id, "csv")}>
                        CSV
                      </button>
                      <button className="link-button" onClick={() => exportAnalytics(link.id, "json")}>
                        JSON
                      </button>
                      <button className="link-button link-button--danger" onClick={() => deleteLink(link.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!links.length && !loading ? (
                  <tr>
                    <td colSpan="7" className="table__empty">
                      No links yet. Create your first short link to get started.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel__header">
              <h2>Profile</h2>
            </div>
            <form className="stack-form" onSubmit={saveProfile}>
              <input
                className="input"
                placeholder="First name"
                value={profileForm.firstName}
                onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })}
              />
              <input
                className="input"
                placeholder="Last name"
                value={profileForm.lastName}
                onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })}
              />
              <input
                className="input"
                placeholder="Email"
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
              />
              <button className="primary-button" type="submit">
                Save profile
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>Password</h2>
            </div>
            <form className="stack-form" onSubmit={changePassword}>
              <input
                className="input"
                placeholder="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              />
              <input
                className="input"
                placeholder="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              />
              <button className="primary-button" type="submit">
                Update password
              </button>
            </form>
          </section>
        </div>
      </section>

      <Modal open={open} title="Create new short link" onClose={() => setOpen(false)}>
        <form className="stack-form" onSubmit={createLink}>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <input
            className="input"
            placeholder="Target URL"
            value={form.targetUrl}
            onChange={(event) => setForm({ ...form, targetUrl: event.target.value })}
          />
          <input
            className="input"
            placeholder="Custom alias, for example your-brand"
            value={form.customAlias}
            onChange={(event) => setForm({ ...form, customAlias: event.target.value })}
          />
          <label className="inline-label">
            Expiry date
            <input
              className="input"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            Active after creation
          </label>
          <button className="primary-button" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create link"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
};

export default UserDashboardPage;
