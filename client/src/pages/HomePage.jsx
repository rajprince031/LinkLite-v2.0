import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="marketing-page">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">LinkLite redesigned</p>
          <h1>Short links for modern teams, now with Java backend power.</h1>
          <p className="hero__text">
            Manage branded short URLs, OTP-secured accounts, QR codes, geo analytics, exports, expiration alerts,
            and an admin-grade control panel without losing the original LinkLite personality.
          </p>
          <div className="hero__actions">
            <Link className="primary-button" to="/signup">
              Create user account
            </Link>
            <Link className="secondary-button" to="/admin/login">
              Admin login
            </Link>
          </div>
        </div>
        <div className="hero__panel">
          <div className="hero__glass">
            <span>Custom aliases</span>
            <span>QR generation</span>
            <span>Geo reports</span>
            <span>CSV and JSON exports</span>
            <span>Per-link IP blocking</span>
            <span>Account controls</span>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {[
          ["OTP verification", "Gmail SMTP-backed sign-up verification and alert delivery."],
          ["User dashboard", "Create links, set expiry, manage aliases, and export analytics instantly."],
          ["Admin console", "See all users, links, and analytics with one-click status controls."],
          ["Security controls", "Block abusive IPs for individual short links without affecting the rest."],
        ].map(([title, description]) => (
          <article className="feature-card" key={title}>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
