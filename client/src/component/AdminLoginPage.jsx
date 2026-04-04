import "../style/logInStyle.css";
import "../style/AdminPages.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Spinner from "./Spinner";

const AdminLoginPage = () => {
    const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
    const navigate = useNavigate();
    const [isSpinner, setIsSpinner] = useState(false);
    const [admin, updateAdmin] = useState({
        email: "",
        password: "",
    });

    const handleAdminLogInRequest = async () => {
        try {
            setIsSpinner(true);

            axios.post(`${LOCALHOST_API}/admin/login`, admin, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((res) => {
                    localStorage.setItem("adminAuthToken", res.data.token);
                    setIsSpinner(false)
                    navigate("/admin/dashboard");
                    return toast.success("Admin login successful")
                })
                .catch(error => {
                    setIsSpinner(false)
                    toast.error(error.response?.data?.message || 'Something went wrong')
                })
        } catch (error) {
            setIsSpinner(false)
            return toast.error('Something went wrong')
        }
    };

    return (
        <div className="main_login_container admin_login_container">
            <div className="navbar__logo" onClick={() => { navigate("/"); }}>
                <p>LinkLite Admin</p>
                <div className="bubble-left">Control center</div>
            </div>
            <div className="form_container" >
                <div className="title_container">
                    <p className="title">Admin Login</p>
                    <span className="subtitle">
                        Monitor users, analytics, emails, and short links.
                    </span>
                </div>
                <div className="input_container">
                    <label className="input_label" htmlFor="email_field">Admin Email</label>
                    <input
                        value={admin.email}
                        onChange={(e) => updateAdmin({ ...admin, email: e.target.value })}
                        placeholder="Enter admin email"
                        type="text"
                        className="input_field"
                    />
                </div>
                <div className="input_container">
                    <label className="input_label" htmlFor="password_field">Password</label>
                    <input
                        value={admin.password}
                        onChange={(e) => updateAdmin({ ...admin, password: e.target.value })}
                        placeholder="Password"
                        type="password"
                        className="input_field"
                    />
                </div>
                <button onClick={handleAdminLogInRequest} className="sign-in_btn">
                    {isSpinner && <span><Spinner /></span>}
                    {!isSpinner && <span>Admin Sign In</span>}
                </button>
            </div>
            <div className="login_page_footer">
                <p>© 2024 LINKLITE. All rights reserved.</p>
            </div>
        </div>
    );
};

export default AdminLoginPage;
