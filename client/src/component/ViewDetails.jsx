import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment-timezone";
import "../style/Workspace.css";
import "../style/viewDetailsStyle.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "./Loader";
import QrDialog from "./QrDialog";
import VisitInfoDialog from "./VisitInfoDialog";
import UserWorkspaceSidebar from "./UserWorkspaceSidebar";
import { logout } from "../redux/slices/UserDetails";
import GenerateLink from "./GenerateLink";

function formatTime(dateString) {
  const date = moment.utc(dateString);
  return date.tz("Asia/Kolkata").format("DD/MM/YYYY - HH:mm:ss");
}

const ViewDetails = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const user = useSelector((state) => state.userProfile);
  const urlId = id;

  const [searchText, setSearchText] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("workspaceTheme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedQrLink, setSelectedQrLink] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [blockIp, setBlockIp] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [details, setDetails] = useState({
    link: {
      shortUrl: "",
      targetUrl: "",
      title: "",
      qrCodeDataUrl: "",
      expiresAt: null
    },
    visits: [],
    blockedIps: []
  });

  const truncateTitle = (value, limit = 18) => {
    if (!value) return "";
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
  };

  const truncateUrl = (value, limit = 32) => {
    if (!value) return "";
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
  };

  const handleCreateLink = () => {
    localStorage.setItem("dashboardActiveSection", "links");
    navigate("/dashboard");
  };

  useEffect(() => {
    localStorage.setItem("workspaceTheme", theme);
  }, [theme]);

  const openDashboardSection = (section) => {
    localStorage.setItem("dashboardActiveSection", section);
    navigate("/dashboard");
  };

  useEffect(() => {
    if (!urlId) {
      navigate("/dashboard");
    }
  }, [navigate, urlId]);

  useEffect(() => {
    if (!showFilterMenu && !showSortMenu) return undefined;
    const handleClickOutside = (event) => {
      if (!event.target.closest(".workspace_table_header_actions")) {
        setShowFilterMenu(false);
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterMenu, showSortMenu]);

  const getAllDetails = () => {
    setIsLoading(true);
    axios(`${LOCALHOST_API}/links/${urlId}`, {
      headers: {
        authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    }).then((res) => {
      setDetails(res.data);
    }).catch((error) => {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Something went wrong");
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (urlId) getAllDetails();
  }, [urlId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterBy, sortOrder]);

  const filteredVisits = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const result = details.visits.filter((visit) => {
      const ip = (visit.ipAddress || "").toLowerCase();
      const browser = (visit.browser || "").toLowerCase();
      const country = (visit.country || "").toLowerCase();

      if (!keyword) return true;
      if (filterBy === "ip") return ip.includes(keyword);
      if (filterBy === "browser") return browser.includes(keyword);
      if (filterBy === "country") return country.includes(keyword);
      return `${ip} ${browser} ${country}`.includes(keyword);
    });

    return [...result].sort((left, right) => {
      if (sortOrder === "oldest") return new Date(left.visitedAt) - new Date(right.visitedAt);
      return new Date(right.visitedAt) - new Date(left.visitedAt);
    });
  }, [details.visits, searchText, filterBy, sortOrder]);

  const pagedVisits = useMemo(() => {
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(filteredVisits.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      totalPages,
      currentPage: safePage,
      items: filteredVisits.slice(start, start + pageSize)
    };
  }, [filteredVisits, currentPage]);

  const fillerVisitCount = Math.max(0, 8 - pagedVisits.items.length);

  const handleBlockIp = () => {
    if (!blockIp.trim()) return toast.error("IP address is required");
    axios.post(`${LOCALHOST_API}/links/${urlId}/blocked-ips`, {
      ipAddress: blockIp.trim(),
      reason: blockReason.trim()
    }, {
      headers: {
        authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    }).then(() => {
      toast.success("IP blocked successfully");
      setBlockIp("");
      setBlockReason("");
      getAllDetails();
    }).catch((error) => toast.error(error.response?.data?.message || "Unable to block IP"));
  };

  const handleRemoveBlockedIp = (blockedIpId) => {
    axios.delete(`${LOCALHOST_API}/links/${urlId}/blocked-ips/${blockedIpId}`, {
      headers: {
        authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    }).then(() => {
      toast.success("Blocked IP removed");
      getAllDetails();
    }).catch((error) => toast.error(error.response?.data?.message || "Unable to remove IP"));
  };

  const handleExportAnalytics = (format) => {
    axios.get(`${LOCALHOST_API}/links/${urlId}/export?format=${format}`, {
      headers: {
        authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    }).then((res) => {
      const binary = atob(res.data.base64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: format === "json" ? "application/json" : "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${urlId}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    }).catch((error) => toast.error(error.response?.data?.message || "Unable to export analytics"));
  };

  return isLoading ? <Loader /> : (
    <div className={`workspace_shell view_details_shell ${theme === "dark" ? "workspace_theme_dark" : ""}`}>
      <UserWorkspaceSidebar
        user={user}
        activeItem="links"
        onNavigate={(section) => {
          openDashboardSection(section);
          setSidebarOpen(false);
        }}
        onOpenProfile={() => {
          openDashboardSection("profile");
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
            <h1>View Details</h1>
          </div>
          <div className="workspace_topbar_actions">
            <button className="workspace_icon_button workspace_refresh_button" type="button" onClick={getAllDetails}>↻</button>
            <GenerateLink
              updateNewUrl={handleCreateLink}
              triggerClassName="workspace_primary_button workspace_topbar_create_button"
              triggerContent="Create Link"
            />
          </div>
        </div>

        <section className="workspace_split_grid">
          <div className="workspace_panel view_details_summary_card">
            <div className="workspace_panel_header">
              <div>
                <h2 title={details.link.title}>{truncateTitle(details.link.title)}</h2>
                <p>Detailed report for this short link</p>
              </div>
            </div>
            <div className="view_details_summary_grid">
              <div className="view_details_summary_item">
                <span>Generated link</span>
                <a href={details.link.shortUrl} target="_blank" rel="noreferrer" title={details.link.shortUrl}>{truncateUrl(details.link.shortUrl)}</a>
              </div>
              <div className="view_details_summary_item">
                <span>Destination</span>
                <a href={details.link.targetUrl} target="_blank" rel="noreferrer" title={details.link.targetUrl}>{truncateUrl(details.link.targetUrl)}</a>
              </div>
              <div className="view_details_summary_item">
                <span>Expiry</span>
                <strong>{details.link.expiresAt ? new Date(details.link.expiresAt).toLocaleString() : "No expiry"}</strong>
              </div>
            </div>
            <div className="view_details_action_row">
              <button className="workspace_secondary_button" type="button" onClick={() => setSelectedQrLink(details.link)}>Open QR</button>
              <button className="workspace_secondary_button" type="button" onClick={() => handleExportAnalytics("csv")}>Export CSV</button>
              <button className="workspace_secondary_button" type="button" onClick={() => handleExportAnalytics("json")}>Export JSON</button>
            </div>
          </div>

          <div className="workspace_panel view_details_block_panel">
            <div className="workspace_panel_header">
              <div>
                <h2>Blocked IP management</h2>
                <p>Restrict suspicious visitors for this link</p>
              </div>
            </div>
            <div className="view_details_block_form">
              <input
                className="workspace_form_input"
                placeholder="Block IP address"
                value={blockIp}
                onChange={(e) => setBlockIp(e.target.value)}
              />
              <input
                className="workspace_form_input"
                placeholder="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
              <button className="workspace_primary_button" type="button" onClick={handleBlockIp}>Block IP</button>
            </div>
            <div className="view_details_block_list">
              {details.blockedIps.length === 0 && <div className="workspace_activity_item placeholder"><div className="workspace_activity_item_main"><strong>No blocked IPs</strong><span>Everything is open right now.</span></div><small>--</small></div>}
              {details.blockedIps.map((item) => (
                <div key={item.id} className="workspace_activity_item">
                  <div className="workspace_activity_item_main">
                    <strong title={item.ipAddress}>{truncateUrl(item.ipAddress, 22)}</strong>
                    <span>{item.reason || "No reason added"}</span>
                  </div>
                  <button className="workspace_action_link" type="button" onClick={() => handleRemoveBlockedIp(item.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="workspace_panel workspace_table_card">
          <div className="workspace_table_card_header">
            <div>
              <h2>User access records</h2>
            </div>
            <div className="workspace_table_header_actions">
              <div className="workspace_control_menu_wrapper">
                <button className={`workspace_table_control ${showFilterMenu ? "active" : ""}`} type="button" onClick={() => {
                  setShowFilterMenu((value) => !value);
                  setShowSortMenu(false);
                }}>Filter</button>
                {showFilterMenu && (
                  <div className="workspace_dropdown_menu workspace_control_dropdown">
                    <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("all"); setShowFilterMenu(false); }}>All</button>
                    <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("ip"); setShowFilterMenu(false); }}>IP only</button>
                    <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("browser"); setShowFilterMenu(false); }}>Browser only</button>
                    <button type="button" className="workspace_dropdown_item" onClick={() => { setFilterBy("country"); setShowFilterMenu(false); }}>Country only</button>
                  </div>
                )}
              </div>
              <div className="workspace_control_menu_wrapper">
                <button className={`workspace_table_control ${showSortMenu ? "active" : ""}`} type="button" onClick={() => {
                  setShowSortMenu((value) => !value);
                  setShowFilterMenu(false);
                }}>Sort</button>
                {showSortMenu && (
                  <div className="workspace_dropdown_menu workspace_control_dropdown">
                    <button type="button" className="workspace_dropdown_item" onClick={() => { setSortOrder("latest"); setShowSortMenu(false); }}>Latest first</button>
                    <button type="button" className="workspace_dropdown_item" onClick={() => { setSortOrder("oldest"); setShowSortMenu(false); }}>Oldest first</button>
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
                placeholder={filterBy === "ip" ? "Search IP address" : filterBy === "browser" ? "Search browser" : filterBy === "country" ? "Search country" : "Search IP, browser, or country"}
              />
            </div>
            <div className="workspace_toolbar_meta">
              <span>{filteredVisits.length} records</span>
            </div>
          </div>

          <div className="workspace_scroll_table">
            <table className="workspace_table workspace_table_minimal">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Country</th>
                  <th>Browser</th>
                  <th>Device</th>
                  <th className="workspace_date_column">Date</th>
                  <th className="workspace_action_column"></th>
                </tr>
              </thead>
              <tbody>
                {pagedVisits.items.map((visit, index) => (
                <tr key={`${visit.ipAddress}-${index}`}>
                  <td>{visit.ipAddress}</td>
                  <td>{visit.country || "Unknown"}</td>
                  <td>{visit.browser || "Unknown"}</td>
                  <td>{visit.deviceType || "Unknown"}</td>
                  <td className="workspace_date_cell">{formatTime(visit.visitedAt)}</td>
                  <td className="workspace_action_cell"><button type="button" className="workspace_small_link_button" onClick={() => setSelectedVisit({
                    linkId: details.link.id,
                    linkTitle: details.link.title,
                    alias: details.link.customAlias || details.link.shortCode || details.link.shortUrl?.split("/").pop(),
                    shortUrl: details.link.shortUrl,
                    targetUrl: details.link.targetUrl,
                    ipAddress: visit.ipAddress,
                    country: visit.country,
                    region: visit.region,
                    city: visit.city,
                    browser: visit.browser,
                    os: visit.os,
                    deviceType: visit.deviceType,
                    userAgent: visit.userAgent,
                    referrer: visit.referrer,
                    blocked: visit.blocked,
                    visitedAt: visit.visitedAt
                  })}>Info</button></td>
                </tr>
              ))}
                {Array.from({ length: fillerVisitCount }).map((_, index) => (
                  <tr key={`details-filler-${index}`} className="workspace_filler_row">
                    <td colSpan="6"></td>
                  </tr>
                ))}
                {pagedVisits.items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="workspace_empty_cell">No activity detected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="workspace_table_footer">
            <span>Page {pagedVisits.currentPage} of {pagedVisits.totalPages}</span>
            <div className="workspace_table_pagination">
              <button type="button" className="workspace_pagination_button" disabled={pagedVisits.currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>‹</button>
              <button type="button" className="workspace_pagination_button active">{pagedVisits.currentPage}</button>
              <button type="button" className="workspace_pagination_button" disabled={pagedVisits.currentPage === pagedVisits.totalPages} onClick={() => setCurrentPage((page) => Math.min(pagedVisits.totalPages, page + 1))}>›</button>
            </div>
          </div>
        </section>

        {selectedQrLink && <QrDialog link={selectedQrLink} onClose={() => setSelectedQrLink(null)} />}
        {selectedVisit && <VisitInfoDialog visit={selectedVisit} onClose={() => setSelectedVisit(null)} />}
      </main>
    </div>
  );
};

export default ViewDetails;
