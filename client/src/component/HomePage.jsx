import "../style/HomePage.css";
import axios from "axios";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const featureCards = [
  {
    title: "Custom short links",
    text: "Create short URLs with optional aliases for campaigns, products, personal use, or team workflows."
  },
  {
    title: "QR code ready",
    text: "Open, preview, download, and share QR images for each shortened link."
  },
  {
    title: "Live analytics",
    text: "Track clicks, timestamps, browsers, devices, countries, regions, and cities."
  },
  {
    title: "Expiry management",
    text: "Use presets, custom expiry windows, expiring-soon review, and no-expiry where needed."
  },
  {
    title: "Blocked IP control",
    text: "Restrict suspicious visitors for specific links and review blocked traffic clearly."
  },
  {
    title: "Reports and exports",
    text: "Open detailed visit logs and export analytics as CSV or JSON."
  },
  {
    title: "Admin workspace",
    text: "Manage users, links, feedback, account states, action history, and flagged activity."
  },
  {
    title: "OTP and recovery",
    text: "Use email OTP verification for signup, password reset, and safer account access."
  }
];

const platformNotes = [
  "Short URL generation with custom aliases",
  "QR preview, download, and share actions",
  "Geo, browser, device, and IP-level visit analytics",
  "Expiry alerts, reports, and exports",
  "Blocked IP protection for individual links",
  "Admin controls for users, links, and feedback",
  "OTP verification and forgot-password recovery"
];

const floatingQuotes = [
  "Shorten links, track results, and control access without clutter.",
  "Everything from QR sharing to blocked IP review lives in one product.",
  "Built for both end users and admin operations."
];

const HomePage = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const user = useSelector((state) => state.userProfile);
  const authToken = localStorage.getItem("authToken");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    message: ""
  });

  const authLabel = useMemo(() => (user?.firstName ? user.firstName : "Create Account"), [user?.firstName]);

  const submitFeedback = () => {
    setIsSubmitting(true);
    axios.post(`${LOCALHOST_API}/feedback`, feedback, {
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      toast.success(response.data.message || "Feedback sent successfully");
      setFeedback({ name: "", email: "", message: "" });
      setIsFeedbackOpen(false);
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to send feedback");
    }).finally(() => setIsSubmitting(false));
  };

  return (
    <div className="landing_shell">
      <div className="landing_page">
        <section className="landing_primary_panel">
          <header className="landing_topbar">
            <button type="button" className="landing_brand" onClick={() => navigate("/")}>
              <span className="landing_brand_mark"></span>
              <span>LinkLite</span>
            </button>

            <div className="landing_topbar_actions">
              <button type="button" className="landing_plain_button" onClick={() => setIsFeedbackOpen(true)}>
                Feedback
              </button>
              {!authToken && (
                <button type="button" className="landing_login_button" onClick={() => navigate("/login")}>
                  Login
                </button>
              )}
              <button type="button" className="landing_cta_button" onClick={() => navigate(authToken ? "/dashboard" : "/signup")}>
                {authLabel}
              </button>
            </div>
          </header>

          <div className="landing_primary_content">
            <div className="landing_copy">
              <span className="landing_kicker">Blue workspace for short links, QR, analytics, and control</span>
              <h1>Build, track, share, and control every short link from one clean LinkLite workspace</h1>
              <p>
                LinkLite is a full link-management platform built with React and Java Spring Boot. Create short URLs,
                assign aliases, generate QR codes, track detailed visits, manage expiry, export reports, block IPs,
                handle OTP verification, and monitor feedback from a modern user and admin dashboard.
              </p>

              <div className="landing_quote_bubble">
                <span className="landing_quote_label">How it works</span>
                <p>Create a link, share it as a short URL or QR, review visits, export reports, and protect it with blocked-IP rules when needed.</p>
              </div>

              <div className="landing_signal_row">
                {floatingQuotes.map((quote, index) => (
                  <article key={quote} className="landing_signal_card">
                    <div className="landing_avatar_cluster">
                      <span className="landing_avatar">{String.fromCharCode(65 + index)}</span>
                      <span className="landing_avatar_glow"></span>
                    </div>
                    <p>{quote}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="landing_visual_stage">
              <div className="landing_glow landing_glow_one"></div>
              <div className="landing_glow landing_glow_two"></div>

              <div className="landing_paper_stack">
                <div className="landing_paper landing_paper_back"></div>
                <div className="landing_paper landing_paper_mid"></div>
                <div className="landing_paper landing_paper_front">
                  <div className="landing_paper_header">
                    <span>Live LinkLite workflow</span>
                  </div>
                  <div className="landing_progress_card">
                    <span>Tracking</span>
                    <div className="landing_progress_track">
                      <span></span>
                    </div>
                    <strong>Realtime</strong>
                  </div>
                  <div className="landing_note_card">
                    <strong>Operations-ready output</strong>
                    <p>Short URL, QR, analytics, reports, blocked IPs, exports, feedback, and admin review in one product.</p>
                  </div>
                </div>
              </div>

              <div className="landing_floating_stat">
                <span>Built for actual usage</span>
                <strong>Users manage links while admins manage accounts, reports, feedback, and security actions.</strong>
              </div>
            </div>
          </div>
        </section>

        <aside className="landing_feature_panel landing_feature_panel_right">
          <div className="landing_feature_intro">
            <span className="landing_feature_tag">Feature overview</span>
            <p>Real LinkLite capabilities, rewritten to match the product that already exists in your app.</p>
          </div>

          <div className="landing_feature_grid">
            {featureCards.map((card, index) => (
              <article key={card.title} className="landing_feature_card">
                <div className="landing_feature_icon">{index + 1}</div>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </article>
            ))}
          </div>

          <div className="landing_capability_strip">
            <strong>Everything important, in smaller sections</strong>
            <div className="landing_capability_list">
              {platformNotes.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {isFeedbackOpen && (
        <div className="landing_feedback_overlay" onClick={() => setIsFeedbackOpen(false)}>
          <div className="landing_feedback_dialog" onClick={(event) => event.stopPropagation()}>
            <div className="landing_feedback_header">
              <div>
                <span className="landing_kicker">Feedback</span>
                <h3>Send a message</h3>
              </div>
              <button type="button" className="landing_feedback_close" onClick={() => setIsFeedbackOpen(false)}>×</button>
            </div>
            <div className="landing_feedback_form">
              <label>
                <span>Name</span>
                <input value={feedback.name} onChange={(event) => setFeedback((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
              </label>
              <label>
                <span>Email</span>
                <input value={feedback.email} onChange={(event) => setFeedback((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" type="email" />
              </label>
              <label>
                <span>Message</span>
                <textarea value={feedback.message} onChange={(event) => setFeedback((current) => ({ ...current, message: event.target.value }))} rows="5" placeholder="Share feedback, feature requests, or suggestions" />
              </label>
            </div>
            <div className="landing_feedback_actions">
              <button type="button" className="landing_plain_button" onClick={() => setIsFeedbackOpen(false)}>Close</button>
              <button type="button" className="landing_cta_button" onClick={submitFeedback} disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
