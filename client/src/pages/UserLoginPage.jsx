import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const UserLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/auth/login", form);
      login("USER", { token: response.data.token, profile: response.data.user });
      toast.success("Welcome back to LinkLite");
      navigate(location.state?.from || "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">User login</p>
        <h1>Access your link workspace</h1>
        <p className="auth-copy">Sign in to manage your short URLs, analytics, QR codes, and security controls.</p>
        <input
          className="input"
          placeholder="Email address"
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
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="helper-row">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
};

export default UserLoginPage;
