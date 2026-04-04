import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const Icon = ({ type }) => {
  const commonProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (type) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <path d="M3 13.2c0-.7.31-1.36.85-1.81l6.3-5.24a2.85 2.85 0 0 1 3.64 0l6.3 5.24c.54.45.85 1.11.85 1.81V20a1 1 0 0 1-1 1h-4.8v-4.9H8.86V21H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "links":
      return (
        <svg {...commonProps}>
          <path d="M10.5 13.5 8 16a3 3 0 1 1-4.24-4.24L6.3 9.2" />
          <path d="m13.5 10.5 2.5-2.5a3 3 0 0 1 4.24 4.24L17.7 14.8" />
          <path d="m9 15 6-6" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...commonProps}>
          <path d="M4 19h16" />
          <path d="M7 16V9" />
          <path d="M12 16V5" />
          <path d="M17 16v-3" />
        </svg>
      );
    case "qr":
      return (
        <svg {...commonProps}>
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
          <path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4zM14 18h2v2h-2z" />
        </svg>
      );
    case "expiry":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case "blocked":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.5 8.5 7 7" />
          <path d="m15.5 8.5-7 7" />
        </svg>
      );
    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case "profile":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M14 7V4.8A1.8 1.8 0 0 0 12.2 3H6.8A1.8 1.8 0 0 0 5 4.8v14.4A1.8 1.8 0 0 0 6.8 21h5.4a1.8 1.8 0 0 0 1.8-1.8V17" />
          <path d="M10 12h10" />
          <path d="m17 8 4 4-4 4" />
        </svg>
      );
    case "theme-light":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <path d="M12 2.5a8.5 8.5 0 1 0 8.5 8.5A6.5 6.5 0 0 1 12 2.5Z" />
        </svg>
      );
  }
};

const baseGroups = [
  {
    heading: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: "dashboard" },
      { id: "links", label: "My Links", icon: "links" },
      { id: "analytics", label: "Analytics", icon: "analytics" },
      { id: "qr", label: "QR Codes", icon: "qr" }
    ]
  },
  {
    heading: "Management",
    items: [
      { id: "expiry", label: "Expiry Alerts", icon: "expiry" },
      { id: "blocked", label: "Blocked IPs", icon: "blocked" },
      { id: "reports", label: "Reports", icon: "reports" }
    ]
  }
];

const UserWorkspaceSidebar = ({
  user,
  activeItem,
  onNavigate,
  onOpenProfile,
  onLogout,
  theme,
  onToggleTheme,
  isOpen = false
}) => {
  const navigate = useNavigate();
  const filteredGroups = useMemo(() => baseGroups, []);

  return (
    <aside className={`workspace_sidebar ${isOpen ? "is_open" : ""}`}>
      <button type="button" className="workspace_brand workspace_brand_large workspace_brand_button" onClick={() => navigate("/")}>
        <span className="workspace_brand_mark"></span>
        <span>LinkLite</span>
      </button>

      <button type="button" className="workspace_sidebar_profile workspace_sidebar_profile_button" onClick={onOpenProfile}>
        <div className="workspace_sidebar_avatar">
          {(user.firstName || "P").slice(0, 1).toUpperCase()}
        </div>
        <div className="workspace_sidebar_profile_meta">
          <span className="workspace_sidebar_profile_role">Workspace user</span>
          <strong>prince</strong>
          <small>prince@gmail.com</small>
        </div>
      </button>

      <div className="workspace_sidebar_nav">
        {filteredGroups.map((group) => (
          <div className="workspace_nav_group" key={group.heading}>
            <p className="workspace_nav_heading">{group.heading}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`workspace_nav_item ${activeItem === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="workspace_nav_icon"><Icon type={item.icon} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="workspace_sidebar_footer">
        <button type="button" className="workspace_theme_toggle" onClick={onToggleTheme}>
          <span className="workspace_theme_toggle_icon">
            <Icon type={theme === "dark" ? "theme-light" : "theme-dark"} />
          </span>
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          <span className={`workspace_theme_toggle_track ${theme === "dark" ? "dark" : ""}`}>
            <span className="workspace_theme_toggle_knob"></span>
          </span>
        </button>

        <button type="button" className="workspace_logout_button" onClick={onLogout}>
          <span className="workspace_nav_icon"><Icon type="logout" /></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default UserWorkspaceSidebar;
