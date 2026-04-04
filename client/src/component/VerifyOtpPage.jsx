import '../style/signUpStyle.css';
import '../style/VerifyOtpPage.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Spinner from './Spinner';

const VerifyOtpPage = () => {
    const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [isSpinner, setIsSpinner] = useState(false);

    const handleVerifyOtp = () => {
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
        axios.post(`${LOCALHOST_API}/auth/resend-otp/${encodeURIComponent(email)}`)
            .then((res) => toast.success(res.data.message || 'OTP sent again'))
            .catch((err) => toast.error(err.response?.data?.message || 'Unable to resend OTP'));
    };

    return (
        <div className="main_signup_container verify_otp_page">
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

                <button onClick={handleVerifyOtp} className="sign-in_btn">
                    {isSpinner && <span><Spinner /></span>}
                    {!isSpinner && <span>Verify OTP</span>}
                </button>

                <p className="note" onClick={handleResendOtp}>Didn&apos;t receive it? <strong>Resend OTP</strong></p>
            </div>
            <div className="signup_page_footer">
                <p>© 2024 LINKLITE. All rights reserved.</p>
            </div>
        </div>
    )
}

export default VerifyOtpPage;
