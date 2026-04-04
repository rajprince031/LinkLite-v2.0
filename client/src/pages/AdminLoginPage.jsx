import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/admin/login", form);
      login("ADMIN", { token: response.data.token, profile: response.data.user });
      toast.success("Admin access granted");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page--admin">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Admin login</p>
        <h1>Enter the LinkLite control room</h1>
        <p className="auth-copy">Monitor users, links, analytics, account states, and system-wide activity from one place.</p>
        <input
          className="input"
          placeholder="Admin email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in as admin"}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
