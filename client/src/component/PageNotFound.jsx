import { Link, useNavigate } from "react-router-dom";
import "../style/FallbackPages.css";

const PageNotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="fallback_shell">
      <div className="fallback_card">
        <button type="button" className="fallback_brand fallback_brand_button" onClick={() => navigate("/")}>
          <span className="fallback_brand_mark"></span>
          <span>LinkLite</span>
        </button>
        <div className="fallback_copy">
          <span className="fallback_eyebrow">404</span>
          <h1>That page doesn't exist</h1>
          <p>The address may be wrong, or the page may have been moved. Use the links below to get back to the main app.</p>
        </div>
        <div className="fallback_actions">
          <Link className="fallback_primary" to="/">Go to home</Link>
          <Link className="fallback_secondary" to="/login">Open login</Link>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
