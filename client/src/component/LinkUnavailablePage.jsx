import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../style/FallbackPages.css";
import useWorkspaceTheme from "../hooks/useWorkspaceTheme";

const contentByType = {
  blocked: {
    eyebrow: "Access restricted",
    title: "This short link is unavailable for you",
    message: "Your IP address has been blocked for this link. If you believe this is a mistake, contact the person who shared the short link with you."
  },
  expired: {
    eyebrow: "Link expired",
    title: "This short link is no longer active",
    message: "The owner set an expiry time for this short link, and that time has already passed."
  },
  inactive: {
    eyebrow: "Link inactive",
    title: "This short link is currently unavailable",
    message: "This short link is not working right now because the owner has disabled it temporarily. Please try again later or contact them directly."
  },
  broken: {
    eyebrow: "Destination unavailable",
    title: "This short link points to a broken destination",
    message: "The short link exists, but its destination is not a valid working website right now."
  },
  "not-found": {
    eyebrow: "Link not found",
    title: "We couldn't find this short link",
    message: "This short link may not exist anymore, may have been deleted, or may have been copied incorrectly."
  }
};

const LinkUnavailablePage = () => {
  const navigate = useNavigate();
  const [theme] = useWorkspaceTheme();
  const [params] = useSearchParams();
  const type = params.get("type") || "blocked";
  const code = params.get("code") || "";

  const content = useMemo(() => contentByType[type] || contentByType["not-found"], [type]);

  return (
    <div className={`fallback_shell ${theme === "dark" ? "fallback_theme_dark" : ""}`}>
      <div className="fallback_card">
        <button type="button" className="fallback_brand fallback_brand_button" onClick={() => navigate("/")}>
          <span className="fallback_brand_mark"></span>
          <span>LinkLite</span>
        </button>
        <div className="fallback_copy">
          <span className="fallback_eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.message}</p>
          {code && (
            <div className="fallback_meta_box">
              <span>Short code</span>
              <strong title={code}>{code}</strong>
            </div>
          )}
        </div>
        <div className="fallback_actions">
          <Link className="fallback_primary" to="/">Go to home</Link>
          <Link className="fallback_secondary" to="/login">Open account</Link>
        </div>
      </div>
    </div>
  );
};

export default LinkUnavailablePage;
