import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api/client";

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/auth/signup", form);
      toast.success(response.data.message);
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <p className="eyebrow">Create user account</p>
        <h1>Build your LinkLite workspace</h1>
        <p className="auth-copy">We&apos;ll send a Gmail OTP verification code to secure your account before first login.</p>
        <div className="form-grid">
          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
        </div>
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
          {submitting ? "Creating account..." : "Create account"}
        </button>
        <p className="helper-row">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
