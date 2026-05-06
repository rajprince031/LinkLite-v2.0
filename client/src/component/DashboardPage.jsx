import axios from "axios";
import "../style/Workspace.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import GenerateLink from "./GenerateLink";
import QrDialog from "./QrDialog";
import Spinner from "./Spinner";
import VisitInfoDialog from "./VisitInfoDialog";
import { useDispatch, useSelector } from "react-redux";
import { logout, userDetails } from "../redux/slices/UserDetails";
import UserWorkspaceSidebar from "./UserWorkspaceSidebar";
import { FIELD_LIMITS, clampValue } from "../utils/fieldLimits";

const Dashboard = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authToken = localStorage.getItem("authToken");
  const user = useSelector((state) => state.userProfile);

  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeSection, setActiveSection] = useState(() => localStorage.getItem("dashboardActiveSection") || "overview");
  const [sortOrder, setSortOrder] = useState("date");
  const [filterBy, setFilterBy] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingExpiry, setEditingExpiry] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recentClicksPage, setRecentClicksPage] = useState(1);
  const [analyticsSearchText, setAnalyticsSearchText] = useState("");
  const [analyticsFilterBy, setAnalyticsFilterBy] = useState("all");
  const [analyticsSortOrder, setAnalyticsSortOrder] = useState("latest");
  const [showAnalyticsFilterMenu, setShowAnalyticsFilterMenu] = useState(false);
  const [showAnalyticsSortMenu, setShowAnalyticsSortMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [theme, setTheme] = useState(() => localStorage.getItem("workspaceTheme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedQrLink, setSelectedQrLink] = useState(null);
  const [qrPage, setQrPage] = useState(1);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [dashboard, setDashboard] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalClicks: 0,
    expiringSoon: 0,
    blockedIps: 0,
    topCountries: [],
    topBrowsers: [],
    topDevices: [],
    recentClicks: [],
    recentLinks: [],
    notifications: [],
    links: []
  });

  const truncateTitle = (value, limit = 42) => {
    if (!value) return "";
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
  };

  const truncateUrl = (value, limit = 44) => {
    if (!value) return "";
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
  };

  const sectionMeta = {
    overview: {
      title: "Dashboard",
      subtitle: "Monitor your short links, activity, and alerts from one clean workspace."
    },
    links: {
      title: "My Links",
      subtitle: "Manage every short URL, alias, expiry setting, and live status."
    },
    analytics: {
      title: "Analytics",
      subtitle: "Review traffic by country, browser, device, and recent visits."
    },
    qr: {
      title: "QR Codes",
      subtitle: "Access QR-ready links and open detailed tracking when needed."
    },
    expiry: {
      title: "Expiry Alerts",
      subtitle: "Review links that need attention before they expire."
    },
    blocked: {
      title: "Blocked IPs",
      subtitle: "See which links have blocked traffic and open them for IP management."
    },
    reports: {
      title: "Reports",
      subtitle: "Open detailed exports and analytics-ready links from a cleaner report view."
    },
    profile: {
      title: "Profile",
      subtitle: "Manage your profile, password, and account controls."
    }
  };

  const loadDashboard = () => {
    setIsLoading(true);
    axios.get(`${LOCALHOST_API}/users/me/dashboard`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then((res) => {
      setDashboard(res.data);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
      toast.error("Unable to load dashboard");
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || ""
    });
  }, [user.firstName, user.lastName]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchText, filterBy, sortOrder]);

  useEffect(() => {
    setQrPage(1);
  }, [dashboard.links.length, searchText, filterBy, sortOrder]);

  useEffect(() => {
    localStorage.setItem("dashboardActiveSection", activeSection);
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem("workspaceTheme", theme);
  }, [theme]);

  useEffect(() => {
    setRecentClicksPage(1);
  }, [activeSection, dashboard.recentClicks.length, analyticsSearchText, analyticsFilterBy, analyticsSortOrder]);

  useEffect(() => {
    if (!showFilterMenu && !showSortMenu && !showAnalyticsFilterMenu && !showAnalyticsSortMenu) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!event.target.closest(".workspace_table_header_actions")) {
        setShowFilterMenu(false);
        setShowSortMenu(false);
        setShowAnalyticsFilterMenu(false);
        setShowAnalyticsSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterMenu, showSortMenu, showAnalyticsFilterMenu, showAnalyticsSortMenu]);

  const visibleLinks = useMemo(() => {
    const filtered = dashboard.links.filter((link) => {
      const keyword = searchText.toLowerCase().trim();
      const title = (link.title || "").toLowerCase();
      const alias = (link.alias || "").toLowerCase();

      if (!keyword) return true;
      if (filterBy === "title") return title.includes(keyword);
      if (filterBy === "alias") return alias.includes(keyword);
      return `${title} ${alias}`.includes(keyword);
    });

    return [...filtered].sort((left, right) => {
      if (sortOrder === "clicks") return right.clicks - left.clicks;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [dashboard.links, searchText, filterBy, sortOrder]);

  const expiringLinks = useMemo(
    () => visibleLinks.filter((link) => link.expiresAt),
    [visibleLinks]
  );

  const blockedLinks = useMemo(
    () => visibleLinks.filter((link) => link.blockedIpCount > 0),
    [visibleLinks]
  );

  const pageSize = 8;

  const getPagedLinks = (links) => {
    const totalPages = Math.max(1, Math.ceil(links.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      totalPages,
      currentPage: safePage,
      items: links.slice(start, start + pageSize)
    };
  };

  const getPagedItems = (items, page, size = 8) => {
    const totalPages = Math.max(1, Math.ceil(items.length / size));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * size;
    return {
      totalPages,
      currentPage: safePage,
      items: items.slice(start, start + size)
    };
  };

  const analyticsVisits = useMemo(() => {
    const keyword = analyticsSearchText.toLowerCase().trim();
    const filtered = dashboard.recentClicks.filter((item) => {
      const ip = (item.ipAddress || "").toLowerCase();
      const browser = (item.browser || "").toLowerCase();
      const country = (item.country || "").toLowerCase();
      const linkTitle = (item.linkTitle || "").toLowerCase();

      if (!keyword) return true;
      if (analyticsFilterBy === "ip") return ip.includes(keyword);
      if (analyticsFilterBy === "browser") return browser.includes(keyword);
      if (analyticsFilterBy === "country") return country.includes(keyword);
      if (analyticsFilterBy === "link") return linkTitle.includes(keyword);
      return `${ip} ${browser} ${country} ${linkTitle}`.includes(keyword);
    });

    return [...filtered].sort((left, right) => {
      if (analyticsSortOrder === "oldest") return new Date(left.timestamp) - new Date(right.timestamp);
      return new Date(right.timestamp) - new Date(left.timestamp);
    });
  }, [dashboard.recentClicks, analyticsSearchText, analyticsFilterBy, analyticsSortOrder]);

  const recentActivityItems = useMemo(() => {
    const clickItems = dashboard.recentClicks.slice(0, 3).map((item, index) => ({
      id: `click-${index}`,
      title: item.ipAddress,
      subtitle: `${item.country || "Unknown"} • ${item.browser || "Unknown"}`,
      meta: new Date(item.timestamp).toLocaleDateString(),
      placeholder: false
    }));

    const linkItems = dashboard.recentLinks.slice(0, 2).map((item, index) => ({
      id: `link-${index}`,
      title: item.title,
      subtitle: item.subtitle,
      meta: new Date(item.timestamp).toLocaleDateString(),
      placeholder: false
    }));

    const merged = [...clickItems, ...linkItems].slice(0, 5);
    while (merged.length < 5) {
      merged.push({
        id: `placeholder-${merged.length}`,
        title: "No activity",
        subtitle: "Waiting for more recent events",
        meta: "--",
        placeholder: true
      });
    }
    return merged;
  }, [dashboard.recentClicks, dashboard.recentLinks]);

  const topStats = [
    { label: "Total links", value: dashboard.totalLinks, helper: "workspace links", action: () => setActiveSection("links") },
    { label: "Active links", value: dashboard.activeLinks, helper: "currently live", action: () => setActiveSection("links") },
    { label: "Total clicks", value: dashboard.totalClicks, helper: "all traffic", action: () => setActiveSection("analytics") },
    { label: "Blocked IPs", value: dashboard.blockedIps, helper: "restricted visits", action: () => setActiveSection("blocked") },
  ];

  const addNewUrl = (newUrl) => {
    setDashboard((current) => ({
      ...current,
      links: [{
        id: newUrl.id,
        title: newUrl.title,
        shortUrl: newUrl.shortUrl,
        targetUrl: newUrl.targetUrl,
        alias: newUrl.customAlias || newUrl.shortCode,
        qrCodeDataUrl: newUrl.qrCodeDataUrl,
        active: newUrl.active,
        statusLabel: newUrl.active ? "Active" : "Inactive",
        clicks: newUrl.clickCount,
        blockedIpCount: 0,
        expiresAt: newUrl.expiresAt,
        createdAt: newUrl.createdAt
      }, ...current.links],
      totalLinks: current.totalLinks + 1,
      activeLinks: current.activeLinks + (newUrl.active ? 1 : 0)
    }));
  };

  const navigateToViewDetailsPage = (urlId) => {
    navigate(`/dashboard/view-details/${urlId}`);
  };

  const changeStatus = (isChanged, id, activeStatus, title) => {
    if (!isChanged) return;
    setDashboard((current) => ({
      ...current,
      links: current.links.map((link) => link.id === id ? {
        ...link,
        active: activeStatus,
        statusLabel: activeStatus ? "Active" : "Inactive"
      } : link),
      activeLinks: current.links.reduce(
        (count, link) => count + ((link.id === id ? activeStatus : link.active) ? 1 : 0),
        0
      )
    }));
    toast.success(`${title} is ${activeStatus ? "Activated" : "Deactivated"}`);
  };

  const toggleLinkStatus = (link) => {
    if (!link.active && user.status === "INACTIVE") {
      toast.info("Go to profile and activate your account before enabling links");
      setActiveSection("profile");
      return;
    }

    axios.patch(`${LOCALHOST_API}/links/${link.id}/status`, {
      active: !link.active
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    }).then((res) => {
      changeStatus(true, link.id, res.data.active, link.title);
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to update link");
    });
  };

  const deleteLink = (isDelete, id, title) => {
    if (!isDelete) return;
    setDashboard((current) => ({
      ...current,
      links: current.links.filter((link) => link.id !== id),
      totalLinks: Math.max(0, current.totalLinks - 1)
    }));
    toast.success(`${title} deleted successfully`);
  };

  const handleDeleteLink = (link) => {
    if (!window.confirm(`Delete "${link.title}"?`)) return;
    axios.delete(`${LOCALHOST_API}/links/${link.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then(() => {
      deleteLink(true, link.id, link.title);
      setOpenMenuId(null);
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to delete link");
    });
  };

  const copyShortLink = async (shortUrl) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setOpenMenuId(null);
      toast.success("Short link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const openRowMenu = (event, linkId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(16, rect.right - 180)
    });
    setOpenMenuId((current) => current === linkId ? null : linkId);
  };

  const openEditDialog = (link) => {
    setEditingLink(link);
    setEditingTitle(link.title);
    setEditingExpiry(link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : "");
    setOpenMenuId(null);
  };

  const saveEditedTitle = () => {
    if (!editingTitle.trim() || !editingLink) {
      return toast.error("Title is required");
    }

    axios.patch(`${LOCALHOST_API}/links/${editingLink.id}`, {
      title: editingTitle.trim(),
      customAlias: editingLink.customAlias ?? null,
      expiresAt: editingExpiry ? new Date(editingExpiry).toISOString() : null
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    }).then((res) => {
      setDashboard((current) => ({
        ...current,
        links: current.links.map((link) => link.id === editingLink.id ? {
          ...link,
          title: res.data.title,
          alias: res.data.customAlias || res.data.shortCode,
          shortUrl: res.data.shortUrl,
          expiresAt: res.data.expiresAt
        } : link)
      }));
      setEditingLink(null);
      setEditingTitle("");
      setEditingExpiry("");
      toast.success("Link updated successfully");
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to update link");
    });
  };

  const logoutAndExit = () => {
    localStorage.removeItem("authToken");
    dispatch(logout());
    navigate("/");
  };

  const saveProfileDetails = () => {
    if (!profileForm.firstName.trim()) {
      return toast.error("First name is required");
    }
    setProfileLoading(true);
    axios.patch(`${LOCALHOST_API}/users/me`, {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim()
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    }).then((res) => {
      dispatch(userDetails(res.data));
      toast.success("Profile updated");
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to update profile");
    }).finally(() => setProfileLoading(false));
  };

  const savePasswordDetails = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error("All password fields are required");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }
    setPasswordLoading(true);
    axios.patch(`${LOCALHOST_API}/users/me/password`, {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    }).then(() => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast.success("Password updated");
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to update password");
    }).finally(() => setPasswordLoading(false));
  };

  const deactivateAccount = () => {
    if (!window.confirm("Deactivate your account now? You will need admin activation to log in again.")) {
      return;
    }
    axios.patch(`${LOCALHOST_API}/users/me/deactivate`, {}, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then((res) => {
      toast.success(res.data.message || "Account deactivated");
      logoutAndExit();
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to deactivate account");
    });
  };

  const reactivateAccount = () => {
    axios.patch(`${LOCALHOST_API}/users/me/reactivate`, {}, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then((res) => {
      dispatch(userDetails(res.data));
      loadDashboard();
      toast.success("Account activated and links restored");
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to activate account");
    });
  };

  const deleteAccount = () => {
    if (!window.confirm("Your account will be scheduled for deletion after 7 days. Continue?")) {
      return;
    }
    axios.delete(`${LOCALHOST_API}/users/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then((res) => {
      toast.success(res.data.message || "Account scheduled for deletion");
      logoutAndExit();
    }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to delete account");
    });
  };

  const renderSectionAction = () => {
    if (activeSection === "overview" || activeSection === "links") {
      return (
        <GenerateLink
          updateNewUrl={addNewUrl}
          triggerClassName="workspace_primary_button"
          triggerContent="+ Create Link"
        />
      );
    }

    if (activeSection === "analytics" || activeSection === "reports" || activeSection === "expiry" || activeSection === "blocked") {
      return (
        <button className="workspace_primary_button" type="button" onClick={loadDashboard}>
          Refresh Data
        </button>
      );
    }

    return (
      <button className="workspace_primary_button" type="button" onClick={() => setActiveSection("links")}>
        Open Links
      </button>
    );
  };

  const renderStatusDot = (link) => <span className={`workspace_status_dot ${link.active ? "active" : "inactive"}`}></span>;

  const renderLinksTable = (links, emptyMessage) => {
    const paged = getPagedLinks(links);
    const fillerCount = Math.max(0, pageSize - paged.items.length);

    return (
    <div className="workspace_panel workspace_table_card">
      <div className="workspace_table_card_header">
        <div>
          <h2>{activeSection === "links" ? "Links" : activeSection === "expiry" ? "Expiry Alerts" : activeSection === "blocked" ? "Blocked IP Links" : "Recent Links"}</h2>
        </div>
        <div className="workspace_table_header_actions">
          <div className="workspace_control_menu_wrapper">
            <button
              className={`workspace_table_control ${showFilterMenu ? "active" : ""}`}
              type="button"
              onClick={() => {
                setShowFilterMenu((value) => !value);
                setShowSortMenu(false);
              }}
            >
              Filter
            </button>
            {showFilterMenu && (
              <div className="workspace_dropdown_menu workspace_control_dropdown">
                <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("all"); setShowFilterMenu(false); }}>Title + Alias</button>
                <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("title"); setShowFilterMenu(false); }}>Title only</button>
                <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("alias"); setShowFilterMenu(false); }}>Alias only</button>
              </div>
            )}
          </div>
          <div className="workspace_control_menu_wrapper">
            <button
              className={`workspace_table_control ${showSortMenu ? "active" : ""}`}
              type="button"
              onClick={() => {
                setShowSortMenu((value) => !value);
                setShowFilterMenu(false);
              }}
            >
              Sort
            </button>
            {showSortMenu && (
              <div className="workspace_dropdown_menu workspace_control_dropdown">
                <button type="button" className="workspace_dropdown_item" onClick={() => { setSortOrder("date"); setShowSortMenu(false); }}>Sort by date</button>
                <button type="button" className="workspace_dropdown_item" onClick={() => { setSortOrder("clicks"); setShowSortMenu(false); }}>Sort by clicks</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="workspace_table_toolbar">
        <div className="workspace_inline_search">
          <span>⌕</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={filterBy === "alias" ? "Search alias" : filterBy === "title" ? "Search title" : "Search title or alias"}
          />
        </div>
        <div className="workspace_toolbar_meta">
          <span>{links.length} records</span>
        </div>
      </div>
      <div className="workspace_scroll_table">
        <table className="workspace_table workspace_table_minimal">
          <thead>
            <tr>
              <th className="workspace_icon_column"></th>
              <th className="workspace_title_column">Title</th>
              <th>Alias</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map((link) => (
              <tr key={link.id} className="workspace_clickable_row" onClick={() => navigateToViewDetailsPage(link.id)}>
                <td onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="workspace_qr_action_button"
                    onClick={() => setSelectedQrLink(link)}
                    aria-label={`Open QR for ${link.title}`}
                  >
                    QR
                  </button>
                </td>
                <td className="workspace_title_cell">
                  <div className="workspace_title_cell_content">
                    <button
                      type="button"
                      className="workspace_title_button workspace_title_button_truncated"
                      title={link.title}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigateToViewDetailsPage(link.id);
                      }}
                    >
                      {truncateTitle(link.title)}
                    </button>
                    <div className="workspace_row_meta_note">
                      <small className="workspace_row_date_note">{new Date(link.createdAt).toLocaleDateString()}</small>
                      <small className="workspace_row_clicks_note">{link.clicks} clicks</small>
                    </div>
                  </div>
                </td>
                <td className="workspace_alias_cell">{link.alias}</td>
                <td onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className={`workspace_toggle_button ${link.active ? "active" : ""}`}
                    onClick={() => toggleLinkStatus(link)}
                  >
                    <span className="workspace_toggle_knob"></span>
                  </button>
                </td>
                <td className="workspace_menu_column" onClick={(event) => event.stopPropagation()}>
                  <div className="workspace_menu_wrapper">
                    <button className="workspace_menu_button" type="button" onClick={(event) => openRowMenu(event, link.id)}>⋮</button>
                  </div>
                </td>
              </tr>
            ))}
            {Array.from({ length: fillerCount }).map((_, index) => (
              <tr key={`filler-${index}`} className="workspace_filler_row">
                <td colSpan="5"></td>
              </tr>
            ))}
            {paged.items.length === 0 && (
              <tr>
                <td colSpan="5" className="workspace_empty_cell">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="workspace_table_footer">
        <span>Page {paged.currentPage} of {paged.totalPages}</span>
        <div className="workspace_table_pagination">
          <button
            type="button"
            className="workspace_pagination_button"
            disabled={paged.currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          <button type="button" className="workspace_pagination_button active">{paged.currentPage}</button>
          <button
            type="button"
            className="workspace_pagination_button"
            disabled={paged.currentPage === paged.totalPages}
            onClick={() => setCurrentPage((page) => Math.min(paged.totalPages, page + 1))}
          >
            ›
          </button>
        </div>
      </div>
    </div>
    );
  };

  const renderOverview = () => (
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
        {renderLinksTable(visibleLinks, "No links found.")}

        <div className="workspace_column">
          <div className="workspace_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Expiring links</h2>
                <p>Small warning list for links that are going to expire.</p>
              </div>
            </div>
            <div className="workspace_activity_list workspace_activity_list_compact workspace_expiry_list">
              {expiringLinks.slice(0, 3).map((link) => (
                <button key={link.id} type="button" className="workspace_activity_item workspace_activity_item_button" onClick={() => navigateToViewDetailsPage(link.id)}>
                  <div className="workspace_activity_item_main">
                    <strong>{link.title}</strong>
                    <span title={link.title}>{truncateTitle(link.title, 26)}</span>
                    <span>Expires on {new Date(link.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <small className="workspace_warning_text">warning</small>
                </button>
              ))}
              {expiringLinks.length === 0 && (
                <div className="workspace_activity_item placeholder">
                  <div className="workspace_activity_item_main">
                    <strong>No expiring links</strong>
                    <span>Everything is stable right now.</span>
                  </div>
                  <small>--</small>
                </div>
              )}
            </div>
          </div>

          <div className="workspace_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Recent activity</h2>
                <p>Recent clicks and links</p>
              </div>
            </div>
            <div className="workspace_activity_list workspace_activity_list_fixed">
              {recentActivityItems.map((item) => (
                <div key={item.id} className={`workspace_activity_item ${item.placeholder ? "placeholder" : ""}`}>
                  <div className="workspace_activity_item_main">
                    <strong title={item.title}>{truncateTitle(item.title, 24)}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <small>{item.meta}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAnalytics = () => (
    (() => {
      const pagedClicks = getPagedItems(analyticsVisits, recentClicksPage, 8);
      const fillerCount = Math.max(0, 8 - pagedClicks.items.length);
      return (
    <div className="workspace_page_stack">
      <section className="workspace_split_grid">
        <div className="workspace_panel workspace_table_card workspace_table_card_auto">
          <div className="workspace_panel_header">
            <div>
              <h2>Traffic by country</h2>
              <p>Most active regions</p>
            </div>
          </div>
          <table className="workspace_table workspace_table_dense">
            <thead>
              <tr>
                <th>Country</th>
                <th>Visits</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topCountries.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
              {dashboard.topCountries.length === 0 && <tr><td colSpan="2" className="workspace_empty_cell">No country data yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="workspace_column">
          <div className="workspace_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Top browsers</h2>
                <p>Browser distribution</p>
              </div>
            </div>
            <div className="workspace_metrics_stack">
              {dashboard.topBrowsers.map((item) => (
                <div key={item.label} className="workspace_metric_row">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
              {dashboard.topBrowsers.length === 0 && <div className="workspace_metric_row"><span className="workspace_muted">No browser data yet.</span></div>}
            </div>
          </div>
          <div className="workspace_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Top devices</h2>
                <p>Device distribution</p>
              </div>
            </div>
            <div className="workspace_metrics_stack">
              {dashboard.topDevices.map((item) => (
                <div key={item.label} className="workspace_metric_row">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
              {dashboard.topDevices.length === 0 && <div className="workspace_metric_row"><span className="workspace_muted">No device data yet.</span></div>}
            </div>
          </div>
        </div>
      </section>

      <div className="workspace_panel workspace_table_card workspace_table_card_auto">
        <div className="workspace_table_card_header">
          <div>
            <h2>Recent clicks</h2>
            <p>Latest visitor records</p>
          </div>
          <div className="workspace_table_header_actions">
            <div className="workspace_control_menu_wrapper">
              <button
                className={`workspace_table_control ${showAnalyticsFilterMenu ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setShowAnalyticsFilterMenu((value) => !value);
                  setShowAnalyticsSortMenu(false);
                }}
              >
                Filter
              </button>
              {showAnalyticsFilterMenu && (
                <div className="workspace_dropdown_menu workspace_control_dropdown">
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsFilterBy("all"); setShowAnalyticsFilterMenu(false); }}>All</button>
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsFilterBy("ip"); setShowAnalyticsFilterMenu(false); }}>IP only</button>
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsFilterBy("browser"); setShowAnalyticsFilterMenu(false); }}>Browser only</button>
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsFilterBy("country"); setShowAnalyticsFilterMenu(false); }}>Country only</button>
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsFilterBy("link"); setShowAnalyticsFilterMenu(false); }}>Link only</button>
                </div>
              )}
            </div>
            <div className="workspace_control_menu_wrapper">
              <button
                className={`workspace_table_control ${showAnalyticsSortMenu ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setShowAnalyticsSortMenu((value) => !value);
                  setShowAnalyticsFilterMenu(false);
                }}
              >
                Sort
              </button>
              {showAnalyticsSortMenu && (
                <div className="workspace_dropdown_menu workspace_control_dropdown">
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsSortOrder("latest"); setShowAnalyticsSortMenu(false); }}>Latest first</button>
                  <button type="button" className="workspace_dropdown_item" onClick={() => { setAnalyticsSortOrder("oldest"); setShowAnalyticsSortMenu(false); }}>Oldest first</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="workspace_table_toolbar">
          <div className="workspace_inline_search">
            <span>⌕</span>
            <input
              value={analyticsSearchText}
              onChange={(event) => setAnalyticsSearchText(event.target.value)}
              placeholder={analyticsFilterBy === "ip" ? "Search IP address" : analyticsFilterBy === "browser" ? "Search browser" : analyticsFilterBy === "country" ? "Search country" : analyticsFilterBy === "link" ? "Search link title" : "Search visits"}
            />
          </div>
          <div className="workspace_toolbar_meta">
            <span>{analyticsVisits.length} records</span>
          </div>
        </div>
        <div className="workspace_scroll_table">
          <table className="workspace_table workspace_table_dense">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Context</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedClicks.items.map((item, index) => (
                <tr key={`${item.ipAddress}-${item.timestamp}-${index}`}>
                  <td>{item.ipAddress}</td>
                  <td>{`${item.country || "Unknown"} • ${item.browser || "Unknown"}`}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td><button type="button" className="workspace_small_link_button" onClick={() => setSelectedVisit(item)}>Info</button></td>
                </tr>
              ))}
              {Array.from({ length: fillerCount }).map((_, index) => (
                <tr key={`analytics-filler-${index}`} className="workspace_filler_row">
                  <td colSpan="4"></td>
                </tr>
              ))}
              {pagedClicks.items.length === 0 && <tr><td colSpan="4" className="workspace_empty_cell">No click activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="workspace_table_footer">
          <span>Page {pagedClicks.currentPage} of {pagedClicks.totalPages}</span>
          <div className="workspace_table_pagination">
            <button type="button" className="workspace_pagination_button" disabled={pagedClicks.currentPage === 1} onClick={() => setRecentClicksPage((page) => Math.max(1, page - 1))}>‹</button>
            <button type="button" className="workspace_pagination_button active">{pagedClicks.currentPage}</button>
            <button type="button" className="workspace_pagination_button" disabled={pagedClicks.currentPage === pagedClicks.totalPages} onClick={() => setRecentClicksPage((page) => Math.min(pagedClicks.totalPages, page + 1))}>›</button>
          </div>
        </div>
      </div>
    </div>
      );
    })()
  );

  const renderQrSection = () => (
    (() => {
      const paged = getPagedItems(visibleLinks, qrPage, 8);
      const fillerCount = Math.max(0, 8 - paged.items.length);

      return (
        <div className="workspace_panel workspace_table_card">
          <div className="workspace_panel_header">
            <div>
              <h2>QR code links</h2>
              <p>Open details to download exports and manage blocked IPs</p>
            </div>
          </div>
          <div className="workspace_scroll_table">
            <table className="workspace_table workspace_table_dense">
              <thead>
                <tr>
                  <th className="workspace_qr_column">QR</th>
                  <th className="workspace_qr_title_column">Title</th>
                  <th className="workspace_qr_url_column">Short URL</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((link) => (
                  <tr key={link.id}>
                    <td>{link.qrCodeDataUrl ? <button type="button" className="workspace_qr_thumb_button" onClick={() => setSelectedQrLink(link)}><img className="workspace_qr_thumb" src={link.qrCodeDataUrl} alt={link.title} /></button> : "N/A"}</td>
                    <td className="workspace_truncate_cell" title={link.title}>{truncateTitle(link.title, 24)}</td>
                    <td className="workspace_truncate_cell" title={link.shortUrl}>{truncateUrl(link.shortUrl, 24)}</td>
                    <td><span className={`workspace_pill ${link.statusLabel.toLowerCase()}`}>{link.statusLabel}</span></td>
                    <td><button className="workspace_action_link" onClick={() => navigateToViewDetailsPage(link.id)}>Open details</button></td>
                  </tr>
                ))}
                {Array.from({ length: fillerCount }).map((_, index) => (
                  <tr key={`qr-filler-${index}`} className="workspace_filler_row">
                    <td colSpan="5"></td>
                  </tr>
                ))}
                {paged.items.length === 0 && <tr><td colSpan="5" className="workspace_empty_cell">No QR enabled links yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="workspace_table_footer">
            <span>Page {paged.currentPage} of {paged.totalPages}</span>
            <div className="workspace_table_pagination">
              <button type="button" className="workspace_pagination_button" disabled={paged.currentPage === 1} onClick={() => setQrPage((page) => Math.max(1, page - 1))}>‹</button>
              <button type="button" className="workspace_pagination_button active">{paged.currentPage}</button>
              <button type="button" className="workspace_pagination_button" disabled={paged.currentPage === paged.totalPages} onClick={() => setQrPage((page) => Math.min(paged.totalPages, page + 1))}>›</button>
            </div>
          </div>
        </div>
      );
    })()
  );

  const renderReportsSection = () => (
    <div className="workspace_panel workspace_table_card">
      <div className="workspace_panel_header">
        <div>
          <h2>Export-ready reports</h2>
          <p>Open any detailed link report to export CSV or JSON analytics</p>
        </div>
      </div>
      <div className="workspace_scroll_table">
        <table className="workspace_table workspace_table_dense">
          <thead>
            <tr>
              <th className="workspace_report_title_column">Title</th>
              <th className="workspace_report_alias_column">Alias</th>
              <th className="workspace_date_column">Date-Time</th>
              <th>Clicks</th>
              <th>Status</th>
              <th className="workspace_action_column"></th>
            </tr>
          </thead>
          <tbody>
            {visibleLinks.map((link) => (
              <tr key={link.id}>
                <td className="workspace_truncate_cell" title={link.title}>{truncateTitle(link.title, 28)}</td>
                <td className="workspace_truncate_cell" title={link.alias}>{truncateTitle(link.alias, 18)}</td>
                <td className="workspace_date_cell">{new Date(link.createdAt).toLocaleString()}</td>
                <td>{link.clicks}</td>
                <td><span className={`workspace_pill ${link.statusLabel.toLowerCase()}`}>{link.statusLabel}</span></td>
                <td className="workspace_action_cell"><button className="workspace_small_link_button" onClick={() => navigateToViewDetailsPage(link.id)}>Details</button></td>
              </tr>
            ))}
            {visibleLinks.length === 0 && <tr><td colSpan="6" className="workspace_empty_cell">No links available for reporting.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="workspace_profile_sections">
      <div className="workspace_panel">
        <div className="workspace_panel_header">
          <div>
            <h2>Account overview</h2>
            <p>Your overall workspace account details</p>
          </div>
        </div>
        <section className="workspace_profile_stat_grid workspace_profile_stat_grid_full">
          <button type="button" className="workspace_stat_card workspace_stat_button" onClick={() => setActiveSection("links")}>
            <p>Total links</p>
            <div className="workspace_stat_value"><strong>{dashboard.totalLinks}</strong><span className="workspace_muted">created</span></div>
          </button>
          <button type="button" className="workspace_stat_card workspace_stat_button" onClick={() => setActiveSection("analytics")}>
            <p>Total clicks</p>
            <div className="workspace_stat_value"><strong>{dashboard.totalClicks}</strong><span className="workspace_muted">tracked</span></div>
          </button>
          <button type="button" className="workspace_stat_card workspace_stat_button" onClick={() => setActiveSection("blocked")}>
            <p>Blocked IPs</p>
            <div className="workspace_stat_value"><strong>{dashboard.blockedIps}</strong><span className="workspace_muted">restricted</span></div>
          </button>
          <div className="workspace_stat_card">
            <p>Account created</p>
            <div className="workspace_stat_value"><strong>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "--"}</strong><span className="workspace_muted">joined</span></div>
          </div>
        </section>
      </div>
      <div className="workspace_panel">
        <div className="workspace_panel_header">
          <div>
            <h2>Profile details</h2>
            <p>Edit your main account information here</p>
          </div>
        </div>
        <div className="workspace_profile_forms">
          <label className="workspace_form_field">
            <span>First name</span>
            <input
              className="workspace_form_input"
              value={profileForm.firstName}
              maxLength={FIELD_LIMITS.firstName}
              onChange={(event) => setProfileForm((current) => ({ ...current, firstName: clampValue(event.target.value, FIELD_LIMITS.firstName) }))}
            />
          </label>
          <label className="workspace_form_field">
            <span>Last name</span>
            <input
              className="workspace_form_input"
              value={profileForm.lastName}
              maxLength={FIELD_LIMITS.lastName}
              onChange={(event) => setProfileForm((current) => ({ ...current, lastName: clampValue(event.target.value, FIELD_LIMITS.lastName) }))}
            />
          </label>
          <label className="workspace_form_field workspace_form_field_full">
            <span>Email</span>
            <input className="workspace_form_input" value={user.email || ""} readOnly />
          </label>
          <div className="workspace_profile_action_row">
            <button type="button" className="workspace_primary_button" onClick={saveProfileDetails} disabled={profileLoading}>
              {profileLoading ? "Saving..." : "Save details"}
            </button>
          </div>
        </div>
      </div>
      <div className="workspace_panel">
        <div className="workspace_panel_header">
          <div>
            <h2>Password</h2>
            <p>Change your current password securely</p>
          </div>
        </div>
        <div className="workspace_profile_forms">
          <label className="workspace_form_field">
            <span>Current password</span>
            <input
              type="password"
              className="workspace_form_input"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
            />
          </label>
          <label className="workspace_form_field">
            <span>New password</span>
            <input
              type="password"
              className="workspace_form_input"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
            />
          </label>
          <label className="workspace_form_field workspace_form_field_full">
            <span>Confirm password</span>
            <input
              type="password"
              className="workspace_form_input"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
          </label>
          <div className="workspace_profile_action_row">
            <button type="button" className="workspace_secondary_button" onClick={savePasswordDetails} disabled={passwordLoading}>
              {passwordLoading ? "Saving..." : "Change password"}
            </button>
          </div>
        </div>
      </div>
      <div className="workspace_panel workspace_profile_section_full">
        <div className="workspace_panel_header">
          <div>
            <h2>Account access</h2>
            <p>Deactivate, activate, or delete your account with confirmation</p>
          </div>
        </div>
        <div className="workspace_account_status_box">
          <strong>Current status: {user.status || "ACTIVE"}</strong>
          <span>
            {user.status === "INACTIVE"
              ? "Your links are paused until you activate the account again."
              : user.status === "DELETION_PENDING"
              ? "Deletion is pending. Logging in cancelled the delete request if it was still within 7 days."
              : "Your account is active and your saved link states are available."}
          </span>
        </div>
        <div className="workspace_account_danger_zone">
          {user.status === "INACTIVE" ? (
            <button type="button" className="workspace_primary_button" onClick={reactivateAccount}>
              Activate account
            </button>
          ) : (
            <button type="button" className="workspace_secondary_button" onClick={deactivateAccount}>
              Deactivate account
            </button>
          )}
          <button type="button" className="workspace_danger_button" onClick={deleteAccount}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  );

  const renderSectionBody = () => {
    if (activeSection === "overview") return renderOverview();
    if (activeSection === "links") return renderLinksTable(visibleLinks, "No links found for your search.");
    if (activeSection === "analytics") return renderAnalytics();
    if (activeSection === "qr") return renderQrSection();
    if (activeSection === "expiry") return renderLinksTable(expiringLinks, "No expiring links right now.");
    if (activeSection === "blocked") return renderLinksTable(blockedLinks, "No blocked IP activity yet.");
    if (activeSection === "reports") return renderReportsSection();
    return renderProfileSection();
  };

  return (
    <div className={`workspace_shell ${theme === "dark" ? "workspace_theme_dark" : ""}`}>
      <UserWorkspaceSidebar
        user={user}
        activeItem={activeSection}
        onNavigate={(section) => {
          setActiveSection(section);
          setSidebarOpen(false);
        }}
        onOpenProfile={() => {
          setActiveSection("profile");
          setSidebarOpen(false);
        }}
        onLogout={() => {
          localStorage.removeItem("authToken");
          dispatch(logout());
          navigate("/");
        }}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        isOpen={sidebarOpen}
      />
      {sidebarOpen && <button type="button" className="workspace_sidebar_overlay" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}></button>}

      <main className="workspace_content">
        <div className="workspace_topbar">
          <div className="workspace_page_identity">
            <button type="button" className="workspace_mobile_menu_button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle sidebar">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1>{sectionMeta[activeSection]?.title || "Dashboard"}</h1>
          </div>
          <div className="workspace_topbar_actions">
            <button className="workspace_icon_button workspace_refresh_button" type="button" onClick={loadDashboard}>↻</button>
            <div className="workspace_control_menu_wrapper">
              <button className="workspace_icon_button" type="button" onClick={() => setShowNotifications((value) => !value)}>🔔</button>
              {showNotifications && (
                <div className="workspace_dropdown_menu workspace_notification_dropdown">
                  {dashboard.notifications.length === 0 && <div className="workspace_dropdown_empty">No notifications</div>}
                  {dashboard.notifications.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="workspace_notification_menu_item">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <GenerateLink
              updateNewUrl={addNewUrl}
              triggerClassName="workspace_primary_button workspace_topbar_create_button"
              triggerContent="Create Link"
            />
          </div>
        </div>

        {isLoading ? <Spinner /> : renderSectionBody()}

        {openMenuId && (
          <div className="workspace_menu_overlay" onClick={() => setOpenMenuId(null)}>
            <div
              className="workspace_dropdown_menu workspace_floating_menu"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const link = dashboard.links.find((item) => item.id === openMenuId);
                if (!link) return null;
                return (
                  <>
                    <button type="button" className="workspace_dropdown_item" onClick={() => copyShortLink(link.shortUrl)}>Copy short link</button>
                    <button type="button" className="workspace_dropdown_item" onClick={() => openEditDialog(link)}>Edit</button>
                    <button type="button" className="workspace_dropdown_item workspace_dropdown_item_danger" onClick={() => handleDeleteLink(link)}>Delete</button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {editingLink && (
          <div className="workspace_modal_overlay" onClick={() => setEditingLink(null)}>
            <div className="workspace_modal_card" onClick={(event) => event.stopPropagation()}>
              <h3>Edit</h3>
              <label className="workspace_modal_label">
                <span>Title</span>
                <input
                  className="workspace_modal_input"
                  value={editingTitle}
                  maxLength={FIELD_LIMITS.title}
                  onChange={(event) => setEditingTitle(clampValue(event.target.value, FIELD_LIMITS.title))}
                  placeholder="Enter link title"
                />
              </label>
              <label className="workspace_modal_label workspace_modal_input_spaced">
                <span>Expiry time</span>
                <input
                  type="datetime-local"
                  className="workspace_modal_input"
                  value={editingExpiry}
                  onChange={(event) => setEditingExpiry(event.target.value)}
                />
              </label>
              <div className="workspace_modal_inline_actions">
                <button type="button" className="workspace_small_link_button" onClick={() => setEditingExpiry("")}>
                  No expiry
                </button>
              </div>
              <div className="workspace_modal_actions">
                <button type="button" className="workspace_secondary_button" onClick={() => setEditingLink(null)}>Cancel</button>
                <button type="button" className="workspace_primary_button" onClick={saveEditedTitle}>Save</button>
              </div>
            </div>
          </div>
        )}

        {selectedQrLink && <QrDialog link={selectedQrLink} onClose={() => setSelectedQrLink(null)} />}
        {selectedVisit && <VisitInfoDialog visit={selectedVisit} onClose={() => setSelectedVisit(null)} />}
      </main>
    </div>
  );
};

export default Dashboard;
