import { Link, NavLink } from "react-router-dom";

const AppShell = ({ title, subtitle, role, onLogout, children, actions }) => {
  const isAdmin = role === "ADMIN";

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <Link to="/" className="brand">
          <span className="brand__wordmark">LinkLite</span>
          <span className="brand__tag">Smarter links, sharper insights</span>
        </Link>
        <nav className="shell__nav">
          {!isAdmin && <NavLink to="/dashboard">My Dashboard</NavLink>}
          {!isAdmin && <NavLink to="/dashboard">My Links</NavLink>}
          {isAdmin && <NavLink to="/admin/dashboard">Admin Console</NavLink>}
          {isAdmin && <NavLink to="/admin/dashboard">User Control</NavLink>}
          {isAdmin && <NavLink to="/admin/dashboard">Link Oversight</NavLink>}
        </nav>
        <button className="secondary-button shell__logout" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className="shell__content">
        <header className="shell__header">
          <div>
            <p className="eyebrow">{isAdmin ? "Admin workspace" : "User workspace"}</p>
            <h1>{title}</h1>
            <p className="shell__subtitle">{subtitle}</p>
          </div>
          {actions && <div className="shell__actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
