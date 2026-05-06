import "../style/logInStyle.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "./Spinner";
import useWorkspaceTheme from "../hooks/useWorkspaceTheme";

const ForgotPasswordPage = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const [theme] = useWorkspaceTheme();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  const requestOtp = () => {
    setIsLoading(true);
    axios.post(`${LOCALHOST_API}/auth/forgot-password`, { email: form.email }, {
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      toast.success(res.data.message || "OTP sent");
      setStep(2);
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to send OTP");
    }).finally(() => setIsLoading(false));
  };

  const resetPassword = () => {
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setIsLoading(true);
    axios.post(`${LOCALHOST_API}/auth/reset-password`, {
      email: form.email,
      otp: form.otp,
      newPassword: form.newPassword
    }, {
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      toast.success(res.data.message || "Password reset successfully");
      navigate("/login");
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to reset password");
    }).finally(() => setIsLoading(false));
  };

  return (
    <div className={`main_login_container ${theme === "dark" ? "auth_theme_dark" : ""}`}>
      <div className="navbar__logo" onClick={() => navigate("/")}>
        <span className="auth_brand_mark"></span>
        <p>LinkLite</p>
        <div className="bubble-left">Experience it now!</div>
      </div>
      <div className="form_container">
        <div className="title_container">
          <p className="title">Recover your account</p>
          <span className="subtitle">
            Use email OTP verification to reset your password safely.
          </span>
        </div>

        <div className="input_container">
          <label className="input_label">Email</label>
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            type="email"
            className="input_field"
          />
        </div>

        {step === 2 && (
          <>
            <div className="input_container">
              <label className="input_label">OTP</label>
              <input
                value={form.otp}
                onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))}
                placeholder="6-digit OTP"
                type="text"
                className="input_field"
              />
            </div>
            <div className="input_container">
              <label className="input_label">New password</label>
              <input
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                placeholder="New password"
                type="password"
                className="input_field"
              />
            </div>
            <div className="input_container">
              <label className="input_label">Confirm password</label>
              <input
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                placeholder="Confirm password"
                type="password"
                className="input_field"
              />
            </div>
          </>
        )}

        <button onClick={step === 1 ? requestOtp : resetPassword} className="sign-in_btn">
          {isLoading ? <span><Spinner /></span> : <span>{step === 1 ? "Send OTP" : "Reset Password"}</span>}
        </button>

        {step === 2 && (
          <p className="note" onClick={requestOtp}>Didn’t get OTP? <strong>Resend</strong></p>
        )}
        <p className="note" onClick={() => navigate("/login")}>Back to <strong>Login</strong></p>
      </div>
      <div className="login_page_footer">
        <p>© 2024 LINKLITE. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
