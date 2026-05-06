import '../style/signUpStyle.css';
import '../style/VerifyOtpPage.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Spinner from './Spinner';
import useWorkspaceTheme from "../hooks/useWorkspaceTheme";

const VerifyOtpPage = () => {
    const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
    const navigate = useNavigate();
    const [theme] = useWorkspaceTheme();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [isSpinner, setIsSpinner] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleVerifyOtp = () => {
        if (isSpinner || isResending) return;
        setIsSpinner(true);
        axios.post(`${LOCALHOST_API}/auth/verify-otp`, { email, otp }, {
            headers: {
                'Content-Type': 'application/json'
            },
        }).then((res) => {
            setIsSpinner(false);
            toast.success(res.data.message || 'OTP verified successfully');
            navigate('/login');
        }).catch((err) => {
            setIsSpinner(false);
            toast.error(err.response?.data?.message || 'Unable to verify OTP');
        });
    };

    const handleResendOtp = () => {
        if (isSpinner || isResending) return;
        setIsResending(true);
        axios.post(`${LOCALHOST_API}/auth/resend-otp/${encodeURIComponent(email)}`)
            .then((res) => toast.success(res.data.message || 'OTP sent again'))
            .catch((err) => toast.error(err.response?.data?.message || 'Unable to resend OTP'))
            .finally(() => setIsResending(false));
    };

    return (
        <div className={`main_signup_container verify_otp_page ${theme === "dark" ? "auth_theme_dark" : ""}`}>
            <div className="navbar__logo" onClick={() => navigate("/")}>
                <span className="auth_brand_mark"></span>
                <p>LinkLite</p>
                <div className="bubble-left">Experience it now!</div>
            </div>
            <div className="form_container">
                <div className="title_container">
                    <p className="title">Verify Your Email</p>
                    <span className="subtitle">
                        Enter the 6-digit OTP sent to {email || "your email"}.
                    </span>
                </div>

                <div className="input_container">
                    <label className="input_label">OTP</label>
                    <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        type="text"
                        className="input_field verify_otp_input"
                    />
                </div>

                <button onClick={handleVerifyOtp} className="sign-in_btn" disabled={isSpinner || isResending}>
                    {isSpinner && <span><Spinner /></span>}
                    {!isSpinner && <span>Verify OTP</span>}
                </button>

                <p className="note" onClick={handleResendOtp}>
                    Didn&apos;t receive it? <strong>{isResending ? "Sending..." : "Resend OTP"}</strong>
                </p>
            </div>
            <div className="signup_page_footer">
                <p>© 2024 LINKLITE. All rights reserved.</p>
            </div>
        </div>
    )
}

export default VerifyOtpPage;
