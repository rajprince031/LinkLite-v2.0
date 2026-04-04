import "../style/AboutPage.css";

const features = [
  {
    title: "Shorten with ease",
    description: "Turn long URLs into short, clean, and manageable links in seconds."
  },
  {
    title: "Custom short links",
    description: "Use custom aliases when you want cleaner, more memorable short URLs."
  },
  {
    title: "QR code generation",
    description: "Generate, open, preview, download, and share QR codes for every link."
  },
  {
    title: "Real-time analytics",
    description: "Track clicks with detailed timing, browser, device, and location insights."
  },
  {
    title: "Geo analytics",
    description: "Review country, region, and city-level information for recent visitors."
  },
  {
    title: "Expiry controls",
    description: "Choose no expiry, quick presets, or a custom expiry time for each link."
  },
  {
    title: "Blocked IP control",
    description: "Protect specific links by blocking suspicious or unwanted IP addresses."
  },
  {
    title: "Reports and exports",
    description: "Open visit reports and download analytics in CSV or JSON format."
  },
  {
    title: "OTP verification",
    description: "Secure signup and password recovery with OTP-based verification."
  },
  {
    title: "Forgot password flow",
    description: "Let users reset passwords safely through the built-in OTP recovery process."
  },
  {
    title: "Admin dashboard",
    description: "Manage users, links, analytics, expired links, blocked users, and feedback."
  },
  {
    title: "Feedback inbox",
    description: "Store contact and landing-page feedback in the database for admin review."
  },
  {
    title: "Link activation control",
    description: "Activate or deactivate links whenever needed without losing their history."
  },
  {
    title: "Responsive workspace",
    description: "Use the product across desktop, tablet, and narrower device sizes more cleanly."
  }
];

const AboutPage = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About LinkLite</h1>
      <p className="about-description">
        LinkLite is more than a simple URL shortener. It helps you create short links, manage aliases,
        generate QR codes, control expiry, track visitors, export reports, protect links with blocked IPs,
        handle OTP-secured account flows, and operate everything from a clean user and admin workspace.
      </p>

      <div className="features-grid">
        {features.map((feature) => (
          <div key={feature.title} className="notification">
            <div className="notiglow"></div>
            <div className="notiborderglow"></div>
            <div className="notititle">{feature.title}</div>
            <div className="notibody">{feature.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;
