import axios from "axios";
import "../style/AdminPages.css";
import "../style/Workspace.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "./Loader";

const ADMIN_TABLE_PAGE_SIZE = 8;
const ADMIN_DENSE_TABLE_ROWS = 6;
const EMPTY_ADMIN_DASHBOARD = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  blockedUsers: 0,
  verifiedUsers: 0,
  totalLinks: 0,
  activeLinks: 0,
  inactiveLinks: 0,
  expiredLinks: 0,
  totalClicks: 0,
  totalFeedback: 0,
  trafficByCountry: [],
  topUsers: [],
  topLinks: [],
  recentUsers: [],
  recentLinks: [],
  actionHistory: [],
  feedback: [],
  users: [],
  links: []
};

const AdminDashboardPage = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const adminAuthToken = localStorage.getItem("adminAuthToken");

  const [isLoading, setIsLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [linkFilter, setLinkFilter] = useState("ALL");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sortMode, setSortMode] = useState("recent");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [linkPage, setLinkPage] = useState(1);
  const [dashboard, setDashboard] = useState(EMPTY_ADMIN_DASHBOARD);

  const sectionMeta = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Overview of users, links, traffic, and recent workspace activity."
    },
    users: {
      title: "Users",
      subtitle: "Manage user access, visibility, account state, and detailed profile activity."
    },
    links: {
      title: "Links",
      subtitle: "Control user-created links, expiry states, and blocked IP visibility."
    },
    analytics: {
      title: "Analytics",
      subtitle: "Track top-performing users, links, and country-level traffic."
    },
    reports: {
      title: "Reports",
      subtitle: "Review recent activity and export-ready operational records."
    },
    security: {
      title: "Security",
      subtitle: "Monitor blocked accounts, deletion-pending users, and risky links."
    },
    notifications: {
      title: "Notifications",
      subtitle: "Keep an eye on expired links, blocked users, feedback, and recent admin changes."
    },
    settings: {
      title: "Settings",
      subtitle: "Administrative tools and account session controls."
    }
  };

  const authHeader = {
    headers: {
      Authorization: `Bearer ${adminAuthToken}`
    }
  };

  const loadDashboard = () => {
    setIsLoading(true);
    axios.get(`${LOCALHOST_API}/admin/dashboard`, authHeader).then((res) => {
      setDashboard({
        ...EMPTY_ADMIN_DASHBOARD,
        ...res.data,
        trafficByCountry: res.data.trafficByCountry || [],
        topUsers: res.data.topUsers || [],
        topLinks: res.data.topLinks || [],
        recentUsers: res.data.recentUsers || [],
        recentLinks: res.data.recentLinks || [],
        actionHistory: res.data.actionHistory || [],
        feedback: res.data.feedback || [],
        users: res.data.users || [],
        links: res.data.links || []
      });
      setIsLoading(false);
    }).catch((error) => {
      setIsLoading(false);
      toast.error(error.response?.data?.message || "Unable to load dashboard");
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeSection]);

  useEffect(() => {
    setUserPage(1);
  }, [globalSearch, userFilter, sortMode, activeSection]);

  useEffect(() => {
    setLinkPage(1);
  }, [globalSearch, linkFilter, sortMode, activeSection]);

  const filteredUsers = useMemo(() => {
    const filtered = dashboard.users.filter((user) => {
      const query = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
      const searchMatch = query.includes(globalSearch.toLowerCase());
      const filterMatch = userFilter === "ALL" ? true : user.status === userFilter;
      return searchMatch && filterMatch;
    });
    return [...filtered].sort((left, right) => {
      if (sortMode === "clicks") return right.totalClicks - left.totalClicks;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [dashboard.users, globalSearch, userFilter]);

  const filteredLinks = useMemo(() => {
    const filtered = dashboard.links.filter((link) => {
      const query = `${link.title} ${link.ownerName} ${link.ownerEmail} ${link.shortUrl} ${link.targetUrl}`.toLowerCase();
      const searchMatch = query.includes(globalSearch.toLowerCase());
      const filterMatch = linkFilter === "ALL" ? true : link.statusLabel === linkFilter;
      return searchMatch && filterMatch;
    });
    return [...filtered].sort((left, right) => {
      if (sortMode === "clicks") return right.clickCount - left.clickCount;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [dashboard.links, globalSearch, linkFilter]);

  const flaggedUsers = useMemo(
    () => dashboard.users.filter((user) => user.status === "BLOCKED" || user.status === "DELETION_PENDING"),
    [dashboard.users]
  );

  const flaggedLinks = useMemo(
    () => dashboard.links.filter((link) => link.statusLabel === "EXPIRED" || link.blockedIpCount > 0),
    [dashboard.links]
  );

  const getPagedItems = (items, page, size = ADMIN_TABLE_PAGE_SIZE) => {
    const totalPages = Math.max(1, Math.ceil(items.length / size));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * size;
    return {
      totalPages,
      currentPage: safePage,
      items: items.slice(start, start + size)
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthToken");
    navigate("/admin/login");
  };

  const updateUserStatus = (user, actionType) => {
    const nextStatus = actionType === "ACTIVE_TOGGLE"
      ? (user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
      : (user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED");

    axios.patch(`${LOCALHOST_API}/admin/users/${user.id}/status`, { status: nextStatus }, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
        "Content-Type": "application/json",
      }
    }).then(() => {
      toast.success(`User set to ${nextStatus.toLowerCase()}`);
      loadDashboard();
      setSelectedUser(null);
    }).catch((error) => toast.error(error.response?.data?.message || "Unable to update user"));
  };

  const updateLinkStatus = (link) => {
    axios.patch(`${LOCALHOST_API}/admin/links/${link.id}/status`, { active: !link.active }, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
        "Content-Type": "application/json",
      }
    }).then(() => {
      toast.success(`Link ${link.active ? "deactivated" : "activated"} successfully`);
      loadDashboard();
      setSelectedLink(null);
    }).catch((error) => toast.error(error.response?.data?.message || "Unable to update link"));
  };

  const sidebarGroups = [
    {
      heading: "Workspace",
      items: [
        { id: "dashboard", label: "Dashboard" },
        { id: "users", label: "Users" },
        { id: "links", label: "Links" },
        { id: "analytics", label: "Analytics" },
      ]
    },
    {
      heading: "Management",
      items: [
        { id: "reports", label: "Reports" },
        { id: "security", label: "Security" }
      ]
    },
    {
      heading: "Support",
      items: [
        { id: "logout", label: "Logout", action: handleLogout }
      ]
    }
  ];

  const topStats = [
    { label: "Total Users", value: dashboard.totalUsers, helper: `${dashboard.activeUsers} active`, action: () => setActiveSection("users") },
    { label: "Blocked Users", value: dashboard.blockedUsers, helper: "restricted accounts", action: () => setActiveSection("security") },
    { label: "Total Links", value: dashboard.totalLinks, helper: `${dashboard.activeLinks} live`, action: () => setActiveSection("links") },
    { label: "Feedback", value: dashboard.totalFeedback, helper: "messages received", action: () => setActiveSection("reports") },
  ];

  const renderStatusBadge = (status) => (
    <span className={`workspace_pill ${status.toLowerCase()}`}>{status}</span>
  );

  const renderSoftStatusChip = (status) => {
    const normalized = status.toLowerCase();
    const icon = normalized === "active" ? "●" : normalized === "blocked" ? "●" : normalized === "expired" ? "◔" : "◔";
    return <span className={`workspace_status_chip ${normalized}`}><span>{icon}</span>{status}</span>;
  };

  const renderUsersTable = (users, emptyMessage) => {
    const paged = getPagedItems(users, userPage);
    const fillerCount = Math.max(0, ADMIN_TABLE_PAGE_SIZE - paged.items.length);

    return (
      <div className="workspace_panel workspace_table_card">
        <div className="workspace_table_card_header">
          <div>
            <h2>User Directory</h2>
          </div>
          <div className="workspace_table_header_actions">
            <button className="workspace_table_control" type="button" onClick={() => setUserFilter("ALL")}>Filter</button>
            <button className="workspace_table_control" type="button" onClick={() => setSortMode((current) => current === "clicks" ? "recent" : "clicks")}>Sort</button>
          </div>
        </div>
        <div className="workspace_table_toolbar">
          <div className="workspace_inline_search">
            <span>⌕</span>
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search employee or email"
            />
          </div>
          <div className="workspace_toolbar_actions">
            <select className="admin_filter_select" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
              <option value="ALL">All users</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DELETION_PENDING">Deletion Pending</option>
            </select>
          </div>
        </div>
        <div className="workspace_scroll_table">
          <table className="workspace_table workspace_table_minimal">
            <thead>
              <tr>
                <th className="workspace_icon_column"></th>
                <th className="workspace_title_column">User</th>
                <th>Email</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <button type="button" className="workspace_qr_action_button" onClick={() => setSelectedUser(user)}>View</button>
                  </td>
                  <td className="workspace_title_cell">
                    <div className="workspace_title_cell_content">
                      <strong className="workspace_title_button workspace_title_button_truncated" title={`${user.firstName} ${user.lastName}`}>
                        {user.firstName} {user.lastName}
                      </strong>
                      <div className="workspace_row_meta_note">
                        <small className="workspace_row_date_note">{new Date(user.createdAt).toLocaleDateString()}</small>
                        <small className="workspace_row_clicks_note">{user.totalClicks} clicks</small>
                      </div>
                    </div>
                  </td>
                  <td className="workspace_alias_cell workspace_truncate_cell" title={user.email}>{user.email}</td>
                  <td>{renderSoftStatusChip(user.status)}</td>
                  <td className="workspace_menu_column">
                    <div className="workspace_row_actions">
                      <button className="workspace_menu_button" type="button" onClick={() => setSelectedUser(user)}>⋮</button>
                      <div className="workspace_hidden_actions">
                        <button className="workspace_action_link" onClick={() => updateUserStatus(user, "ACTIVE_TOGGLE")}>
                          {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        <button className="workspace_action_link" onClick={() => updateUserStatus(user, "BLOCK_TOGGLE")}>
                          {user.status === "BLOCKED" ? "Unblock" : "Block"}
                        </button>
                        <button className="workspace_action_link" onClick={() => setSelectedUser(user)}>Details</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.items.length === 0 && <tr><td colSpan="5" className="workspace_empty_cell">{emptyMessage}</td></tr>}
              {paged.items.length > 0 && Array.from({ length: fillerCount }).map((_, index) => (
                <tr key={`admin-users-filler-${index}`} className="workspace_filler_row">
                  <td colSpan="5"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="workspace_table_footer">
          <span>Page {paged.currentPage} of {paged.totalPages}</span>
          <div className="workspace_table_pagination">
            <button type="button" className="workspace_pagination_button" disabled={paged.currentPage === 1} onClick={() => setUserPage((page) => Math.max(1, page - 1))}>‹</button>
            <button type="button" className="workspace_pagination_button active">{paged.currentPage}</button>
            <button type="button" className="workspace_pagination_button" disabled={paged.currentPage === paged.totalPages} onClick={() => setUserPage((page) => Math.min(paged.totalPages, page + 1))}>›</button>
          </div>
        </div>
      </div>
    );
  };

  const renderLinksTable = (links, emptyMessage) => {
    const paged = getPagedItems(links, linkPage);
    const fillerCount = Math.max(0, ADMIN_TABLE_PAGE_SIZE - paged.items.length);

    return (
    <div className="workspace_panel workspace_table_card">
      <div className="workspace_table_card_header">
        <div>
          <h2>Links</h2>
        </div>
        <div className="workspace_table_header_actions">
          <button className="workspace_table_control" type="button" onClick={() => setLinkFilter("ALL")}>Filter</button>
          <button className="workspace_table_control" type="button" onClick={() => setSortMode((current) => current === "clicks" ? "recent" : "clicks")}>Sort</button>
        </div>
      </div>
      <div className="workspace_table_toolbar">
        <div className="workspace_inline_search">
          <span>⌕</span>
          <input
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search links, owners, or targets"
          />
        </div>
        <div className="workspace_toolbar_actions">
          <select className="admin_filter_select" value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)}>
            <option value="ALL">All links</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>
      <div className="workspace_scroll_table">
        <table className="workspace_table workspace_table_minimal">
          <thead>
            <tr>
              <th className="workspace_icon_column"></th>
              <th className="workspace_title_column">Title</th>
              <th>Owner</th>
              <th>Clicks</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map((link) => (
              <tr key={link.id}>
                <td>
                  <button type="button" className="workspace_qr_action_button" onClick={() => setSelectedLink(link)}>View</button>
                </td>
                <td className="workspace_title_cell">
                  <div className="workspace_title_cell_content">
                    <strong className="workspace_title_button workspace_title_button_truncated" title={link.title}>{link.title}</strong>
                    <div className="workspace_row_meta_note">
                      <small className="workspace_row_date_note">{link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : new Date(link.createdAt).toLocaleDateString()}</small>
                      <small className="workspace_row_clicks_note">{link.blockedIpCount} blocked IPs</small>
                    </div>
                  </div>
                </td>
                <td className="workspace_alias_cell workspace_truncate_cell" title={link.ownerName}>{link.ownerName}</td>
                <td>{link.clickCount}</td>
                <td>{renderSoftStatusChip(link.statusLabel)}</td>
                <td className="workspace_menu_column">
                  <div className="workspace_row_actions">
                    <button className="workspace_menu_button" type="button" onClick={() => setSelectedLink(link)}>⋮</button>
                    <div className="workspace_hidden_actions">
                      <button className="workspace_action_link" onClick={() => updateLinkStatus(link)}>
                        {link.active ? "Deactivate" : "Activate"}
                      </button>
                      <button className="workspace_action_link" onClick={() => setSelectedLink(link)}>Details</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {paged.items.length === 0 && <tr><td colSpan="6" className="workspace_empty_cell">{emptyMessage}</td></tr>}
            {paged.items.length > 0 && Array.from({ length: fillerCount }).map((_, index) => (
              <tr key={`admin-links-filler-${index}`} className="workspace_filler_row">
                <td colSpan="6"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="workspace_table_footer">
        <span>Page {paged.currentPage} of {paged.totalPages}</span>
        <div className="workspace_table_pagination">
          <button type="button" className="workspace_pagination_button" disabled={paged.currentPage === 1} onClick={() => setLinkPage((page) => Math.max(1, page - 1))}>‹</button>
          <button type="button" className="workspace_pagination_button active">{paged.currentPage}</button>
          <button type="button" className="workspace_pagination_button" disabled={paged.currentPage === paged.totalPages} onClick={() => setLinkPage((page) => Math.min(paged.totalPages, page + 1))}>›</button>
        </div>
      </div>
    </div>
  );
  };

  const renderDashboardSection = () => (
    <div className="workspace_page_stack">
      <section className="workspace_stats_grid">
        {topStats.map((stat) => (
          <button key={stat.label} type="button" className="workspace_stat_card workspace_stat_button" onClick={stat.action}>
            <p>{stat.label}</p>
            <div className="workspace_stat_value">
              <strong>{stat.value}</strong>
              <span className="workspace_muted">{stat.helper}</span>
            </div>
          </button>
        ))}
      </section>
      <section className="workspace_split_grid">
        {renderUsersTable(filteredUsers.slice(0, 8), "No users found.")}
        <div className="workspace_column">
          <div className="workspace_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Admin alerts</h2>
                <p>Users, links, and feedback that need attention</p>
              </div>
            </div>
            <div className="workspace_activity_list workspace_activity_list_compact workspace_expiry_list">
              <div className="workspace_activity_item">
                <div className="workspace_activity_item_main">
                  <strong>Expired links</strong>
                  <span>{dashboard.expiredLinks} links need admin review</span>
                </div>
                <small className="workspace_warning_text">warning</small>
              </div>
              <div className="workspace_activity_item">
                <div className="workspace_activity_item_main">
                  <strong>Blocked users</strong>
                  <span>{dashboard.blockedUsers} accounts are currently restricted</span>
                </div>
                <small className="workspace_warning_text">warning</small>
              </div>
              <div className="workspace_activity_item">
                <div className="workspace_activity_item_main">
                  <strong>Feedback inbox</strong>
                  <span>{dashboard.totalFeedback} messages are waiting in reports</span>
                </div>
                <small className="workspace_warning_text">info</small>
              </div>
            </div>
          </div>
          <div className="workspace_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Recent activity</h2>
                <p>Users and links created recently</p>
              </div>
            </div>
            <div className="workspace_activity_list workspace_activity_list_fixed">
              {dashboard.recentUsers.slice(0, 4).map((item, index) => (
                <div key={`recent-user-${index}`} className="workspace_activity_item">
                  <div className="workspace_activity_item_main">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
              {dashboard.recentLinks.slice(0, 4).map((item, index) => (
                <div key={`recent-link-${index}`} className="workspace_activity_item">
                  <div className="workspace_activity_item_main">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="workspace_page_stack">
      <div className="workspace_panel workspace_table_card">
        <div className="workspace_panel_header">
          <div>
            <h2>Traffic by country</h2>
            <p>Geographic visit summary</p>
          </div>
        </div>
        <div className="workspace_scroll_table">
          <table className="workspace_table workspace_table_dense">
            <thead>
              <tr>
                <th>Country</th>
                <th>Visits</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.trafficByCountry.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
              {dashboard.trafficByCountry.length === 0 && <tr><td colSpan="2" className="workspace_empty_cell">No traffic records yet.</td></tr>}
              {dashboard.trafficByCountry.length > 0 && Array.from({ length: Math.max(0, ADMIN_DENSE_TABLE_ROWS - dashboard.trafficByCountry.length) }).map((_, index) => (
                <tr key={`admin-traffic-filler-${index}`} className="workspace_filler_row">
                  <td colSpan="2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <section className="workspace_split_grid">
        <div className="workspace_panel">
          <div className="workspace_panel_header">
            <div>
              <h2>Top users</h2>
              <p>Most clicks by account</p>
            </div>
          </div>
          <div className="workspace_metrics_stack">
            {dashboard.topUsers.map((item) => (
              <div key={item.label} className="workspace_metric_row">
                <div className="workspace_activity_item_main">
                  <strong>{item.label}</strong>
                  <span>{item.subLabel}</span>
                </div>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="workspace_panel">
          <div className="workspace_panel_header">
            <div>
              <h2>Top links</h2>
              <p>Most clicked short URLs</p>
            </div>
          </div>
          <div className="workspace_metrics_stack">
            {dashboard.topLinks.map((item) => (
              <div key={item.label} className="workspace_metric_row">
                <div className="workspace_activity_item_main">
                  <strong>{item.label}</strong>
                  <span>{item.subLabel}</span>
                </div>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderReportsSection = () => (
    <div className="workspace_page_stack">
      <div className="workspace_panel workspace_table_card workspace_table_card_auto">
        <div className="workspace_panel_header">
          <div>
            <h2>Feedback inbox</h2>
            <p>Messages submitted from the LinkLite front page</p>
          </div>
        </div>
        <div className="workspace_scroll_table">
          <table className="workspace_table workspace_table_dense">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.feedback || []).map((item) => (
                <tr key={item.id}>
                  <td className="workspace_truncate_cell" title={item.name}>{item.name}</td>
                  <td className="workspace_truncate_cell" title={item.email}>{item.email}</td>
                  <td className="workspace_truncate_cell" title={item.message}>{item.message}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {(!dashboard.feedback || dashboard.feedback.length === 0) && <tr><td colSpan="4" className="workspace_empty_cell">No feedback messages yet.</td></tr>}
              {(dashboard.feedback || []).length > 0 && Array.from({ length: Math.max(0, ADMIN_DENSE_TABLE_ROWS - dashboard.feedback.length) }).map((_, index) => (
                <tr key={`admin-feedback-filler-${index}`} className="workspace_filler_row">
                  <td colSpan="4"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="workspace_panel workspace_table_card">
        <div className="workspace_panel_header">
          <div>
            <h2>Action history</h2>
            <p>Most recent admin actions in the workspace</p>
          </div>
        </div>
        <div className="workspace_scroll_table">
          <table className="workspace_table workspace_table_dense">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Performed by</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.actionHistory || []).map((item) => (
                <tr key={item.id}>
                  <td className="workspace_truncate_cell" title={item.actionType}>{item.actionType}</td>
                  <td className="workspace_truncate_cell" title={`${item.targetType}: ${item.targetLabel}`}>{item.targetType}: {item.targetLabel}</td>
                  <td className="workspace_truncate_cell" title={item.performedBy}>{item.performedBy}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {(!dashboard.actionHistory || dashboard.actionHistory.length === 0) && <tr><td colSpan="4" className="workspace_empty_cell">No admin actions yet.</td></tr>}
              {(dashboard.actionHistory || []).length > 0 && Array.from({ length: Math.max(0, ADMIN_DENSE_TABLE_ROWS - dashboard.actionHistory.length) }).map((_, index) => (
                <tr key={`admin-history-filler-${index}`} className="workspace_filler_row">
                  <td colSpan="4"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="workspace_page_stack">
      <div className="workspace_panel">
        <div className="workspace_panel_header">
          <div>
            <h2>Attention summary</h2>
            <p>Expired links and restricted users</p>
          </div>
        </div>
        <div className="workspace_notification_list">
          <div className="workspace_notification_item">
            <div className="workspace_notification_item_main">
              <strong>Expired links</strong>
              <span>{dashboard.expiredLinks} links need admin review</span>
            </div>
            <span className="workspace_pill warning">{dashboard.expiredLinks}</span>
          </div>
          <div className="workspace_notification_item">
            <div className="workspace_notification_item_main">
              <strong>Blocked users</strong>
              <span>{dashboard.blockedUsers} accounts are currently restricted</span>
            </div>
            <span className="workspace_pill danger">{dashboard.blockedUsers}</span>
          </div>
          <div className="workspace_notification_item">
            <div className="workspace_notification_item_main">
              <strong>Deletion pending</strong>
              <span>{flaggedUsers.filter((user) => user.status === "DELETION_PENDING").length} users waiting for cleanup</span>
            </div>
            <span className="workspace_pill inactive">{flaggedUsers.filter((user) => user.status === "DELETION_PENDING").length}</span>
          </div>
          <div className="workspace_notification_item">
            <div className="workspace_notification_item_main">
              <strong>Feedback inbox</strong>
              <span>{dashboard.totalFeedback} feedback messages submitted from the landing page</span>
            </div>
            <span className="workspace_pill neutral">{dashboard.totalFeedback}</span>
          </div>
        </div>
      </div>
      {renderReportsSection()}
    </div>
  );

  const renderSettingsSection = () => (
    <div className="workspace_split_grid">
      <div className="workspace_panel">
        <div className="workspace_panel_header">
          <div>
            <h2>Admin session</h2>
            <p>Current admin workspace details</p>
          </div>
        </div>
        <div className="workspace_detail_grid">
          <div className="workspace_detail_item">
            <span>Role</span>
            <strong>Super admin</strong>
          </div>
          <div className="workspace_detail_item">
            <span>Access</span>
            <strong>Users, links, analytics</strong>
          </div>
          <div className="workspace_detail_item workspace_detail_item_full">
            <span>Environment</span>
            <strong>Local development dashboard</strong>
          </div>
        </div>
      </div>
      <div className="workspace_panel">
        <div className="workspace_panel_header">
          <div>
            <h2>Controls</h2>
            <p>Refresh workspace or sign out</p>
          </div>
        </div>
        <div className="workspace_settings_actions">
          <button className="workspace_primary_button" type="button" onClick={loadDashboard}>Refresh Dashboard</button>
          <button className="workspace_secondary_button" type="button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );

  const renderSectionBody = () => {
    if (activeSection === "dashboard") return renderDashboardSection();
    if (activeSection === "users") return renderUsersTable(filteredUsers, "No users match the current search.");
    if (activeSection === "links") return renderLinksTable(filteredLinks, "No links match the current search.");
    if (activeSection === "analytics") return renderAnalyticsSection();
    if (activeSection === "reports") return renderReportsSection();
    if (activeSection === "security") return (
      <div className="workspace_page_stack">
        {renderUsersTable(flaggedUsers, "No flagged users right now.")}
        {renderLinksTable(flaggedLinks, "No risky links right now.")}
      </div>
    );
    return renderDashboardSection();
  };

  return isLoading ? <Loader /> : (
    <div className="workspace_shell">
      <aside className={`workspace_sidebar ${sidebarOpen ? "is_open" : ""}`}>
        <button type="button" className="workspace_brand workspace_brand_button" onClick={() => navigate("/")}>
          <span className="workspace_brand_mark"></span>
          <span>LinkLite</span>
        </button>

        <div className="workspace_sidebar_profile">
          <div className="workspace_sidebar_avatar">A</div>
          <div className="workspace_sidebar_profile_meta">
            <span className="workspace_sidebar_profile_role">Admin workspace</span>
            <strong>LinkLite Admin</strong>
            <small>Users, links, reports</small>
          </div>
        </div>

        {sidebarGroups.map((group) => (
          <div className="workspace_nav_group" key={group.heading}>
            <p className="workspace_nav_heading">{group.heading}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`workspace_nav_item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => {
                  if (item.action) {
                    item.action();
                    return;
                  }
                  setActiveSection(item.id);
                }}
              >
                <span className="workspace_nav_bullet"></span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
      {sidebarOpen && <button type="button" className="workspace_sidebar_overlay" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}></button>}

      <main className="workspace_content">
        <div className="workspace_topbar">
          <div className="workspace_page_identity">
            <button type="button" className="workspace_mobile_menu_button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle sidebar">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1>{sectionMeta[activeSection]?.title}</h1>
            <p>{sectionMeta[activeSection]?.subtitle}</p>
          </div>
          <div className="workspace_topbar_actions">
            <button className="workspace_icon_button" type="button" onClick={loadDashboard}>↻</button>
            <button className="workspace_icon_button" type="button" onClick={() => setActiveSection("security")}>{dashboard.blockedUsers + dashboard.expiredLinks}</button>
            <div className="workspace_profile_box">
              <div className="workspace_profile_avatar">A</div>
              <div className="workspace_profile_meta">
                <strong>LinkLite Admin</strong>
                <span>Super admin</span>
              </div>
            </div>
          </div>
        </div>

        {renderSectionBody()}

        {selectedUser && <div className="admin_modal_overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin_modal_box" onClick={(event) => event.stopPropagation()}>
            <div className="admin_modal_header">
              <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
              <button onClick={() => setSelectedUser(null)}>Close</button>
            </div>
            <div className="admin_modal_details">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Status:</strong> {selectedUser.status}</p>
              <p><strong>Verified:</strong> {selectedUser.emailVerified ? "Yes" : "No"}</p>
              <p><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
              <p><strong>Last Login:</strong> {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Never"}</p>
            </div>
            <div className="admin_modal_subsection">
              <h4>User Links</h4>
              <div className="admin_modal_link_list">
                {(selectedUser.links || []).map((link) => (
                  <div key={link.id} className="admin_modal_link_item">
                    <div>
                      <strong>{link.title}</strong>
                      <p>{link.shortUrl}</p>
                    </div>
                    {renderStatusBadge(link.statusLabel)}
                  </div>
                ))}
                {(!selectedUser.links || selectedUser.links.length === 0) && (
                  <div className="admin_modal_link_item">
                    <div>
                      <strong>No links yet</strong>
                      <p>This user has not created any short links.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>}

        {selectedLink && <div className="admin_modal_overlay" onClick={() => setSelectedLink(null)}>
          <div className="admin_modal_box" onClick={(event) => event.stopPropagation()}>
            <div className="admin_modal_header">
              <h3>{selectedLink.title}</h3>
              <button onClick={() => setSelectedLink(null)}>Close</button>
            </div>
            <div className="admin_modal_details">
              <p><strong>Owner:</strong> {selectedLink.ownerName}</p>
              <p><strong>Email:</strong> {selectedLink.ownerEmail}</p>
              <p><strong>Short URL:</strong> {selectedLink.shortUrl}</p>
              <p><strong>Target URL:</strong> {selectedLink.targetUrl}</p>
              <p><strong>Status:</strong> {selectedLink.statusLabel}</p>
              <p><strong>Clicks:</strong> {selectedLink.clickCount}</p>
              <p><strong>Blocked IPs:</strong> {selectedLink.blockedIpCount}</p>
              <p><strong>Created:</strong> {new Date(selectedLink.createdAt).toLocaleString()}</p>
              <p><strong>Expiry:</strong> {selectedLink.expiresAt ? new Date(selectedLink.expiresAt).toLocaleString() : "No expiry"}</p>
            </div>
          </div>
        </div>}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
