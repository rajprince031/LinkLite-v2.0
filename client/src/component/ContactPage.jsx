import "../style/ContactPage.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useWorkspaceTheme from "../hooks/useWorkspaceTheme";

const contactPoints = [
  { title: "Product feedback", text: "Share what feels useful, unclear, or missing in LinkLite." },
  { title: "Feature requests", text: "Suggest admin tools, analytics improvements, or new workflow ideas." },
  { title: "Technical questions", text: "Reach out if you need help understanding setup or product behavior." }
];

const ContactPage = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const [theme] = useWorkspaceTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const submitFeedback = () => {
    setIsSubmitting(true);
    axios.post(`${LOCALHOST_API}/feedback`, form, {
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      toast.success(response.data.message || "Feedback sent successfully");
      setForm({ name: "", email: "", message: "" });
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to send feedback");
    }).finally(() => setIsSubmitting(false));
  };

  return (
    <div className={`contact_page_shell ${theme === "dark" ? "contact_theme_dark" : ""}`}>
      <header className="contact_page_topbar">
        <button type="button" className="contact_brand" onClick={() => navigate("/")}>
          <span className="contact_brand_mark"></span>
          <span>LinkLite</span>
        </button>
        <div className="contact_topbar_actions">
          <button type="button" className="contact_nav_button" onClick={() => navigate("/")}>Home</button>
          <button type="button" className="contact_nav_button" onClick={() => navigate("/login")}>Log in</button>
        </div>
      </header>

      <main className="contact_page_main">
        <section className="contact_hero_card">
          <div className="contact_hero_copy">
            <span className="contact_kicker">Contact LinkLite</span>
            <h1>Questions, feature ideas, or product feedback? Send it directly here.</h1>
            <p>
              Your message is stored in the LinkLite database so the admin can review it from the admin dashboard.
              Use this page for feedback, collaboration, feature requests, or workflow suggestions.
            </p>
            <div className="contact_point_list">
              {contactPoints.map((item) => (
                <article key={item.title} className="contact_point_card">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="contact_form_card">
            <div className="contact_form_head">
              <span className="contact_kicker">Send message</span>
              <h2>Feedback inbox</h2>
            </div>
            <div className="contact_form_fields">
              <label>
                <span>Name</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
              </label>
              <label>
                <span>Email</span>
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" type="email" />
              </label>
              <label>
                <span>Message</span>
                <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows="6" placeholder="Write your feedback, question, or request" />
              </label>
            </div>
            <div className="contact_form_actions">
              <button type="button" className="contact_primary_button" onClick={submitFeedback} disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;
