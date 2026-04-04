import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api/client";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const email = useMemo(() => new URLSearchParams(search).get("email") || "", [search]);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const verifyOtp = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/auth/verify-otp", { email, otp });
      toast.success(response.data.message);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    try {
      const response = await api.post(`/auth/resend-otp/${encodeURIComponent(email)}`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resend OTP");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={verifyOtp}>
        <p className="eyebrow">OTP verification</p>
        <h1>Confirm your email</h1>
        <p className="auth-copy">Enter the 6-digit code sent to {email || "your inbox"} to activate your account.</p>
        <input
          className="input"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
        />
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Verifying..." : "Verify OTP"}
        </button>
        <button className="secondary-button" type="button" onClick={resendOtp}>
          Resend OTP
        </button>
      </form>
    </div>
  );
};

export default VerifyOtpPage;
