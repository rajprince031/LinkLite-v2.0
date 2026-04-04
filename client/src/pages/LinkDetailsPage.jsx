import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api, attachToken } from "../api/client";
import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";

const LinkDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [details, setDetails] = useState(null);
  const [blockForm, setBlockForm] = useState({ ipAddress: "", reason: "" });
  const authConfig = attachToken(user?.token);

  const loadDetails = async () => {
    try {
      const response = await api.get(`/links/${id}`, authConfig);
      setDetails(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load link details");
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const stats = useMemo(() => {
    const visits = details?.visits || [];
    return {
      clicks: details?.link?.clickCount || 0,
      countries: new Set(visits.map((visit) => visit.country).filter(Boolean)).size,
      blockedIps: details?.blockedIps?.length || 0,
    };
  }, [details]);

  const blockIp = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/links/${id}/blocked-ips`, blockForm, authConfig);
      setBlockForm({ ipAddress: "", reason: "" });
      toast.success("IP blocked for this link");
      loadDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to block IP");
    }
  };

  const unblockIp = async (blockedIpId) => {
    try {
      await api.delete(`/links/${id}/blocked-ips/${blockedIpId}`, authConfig);
      toast.success("Blocked IP removed");
      loadDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove blocked IP");
    }
  };

  return (
    <AppShell
      title={details?.link?.title || "Link details"}
      subtitle="Inspect visits, geo-location tracking, QR code output, and security restrictions for this short URL."
      role="USER"
      onLogout={() => {
        logout("USER");
        navigate("/login");
      }}
      actions={
        <button className="secondary-button" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </button>
      }
    >
      <section className="stats-grid">
        <StatCard label="Total clicks" value={stats.clicks} hint="Combined redirects tracked for this link" />
        <StatCard label="Countries reached" value={stats.countries} hint="Distinct geo regions recorded so far" />
        <StatCard label="Blocked IPs" value={stats.blockedIps} hint="Restricted for this specific short URL" />
      </section>

      {details ? (
        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel__header">
              <h2>Link overview</h2>
            </div>
            <div className="detail-grid">
              <div>
                <p className="detail-label">Short URL</p>
                <a href={details.link.shortUrl} target="_blank" rel="noreferrer">
                  {details.link.shortUrl}
                </a>
              </div>
              <div>
                <p className="detail-label">Target URL</p>
                <a href={details.link.targetUrl} target="_blank" rel="noreferrer">
                  {details.link.targetUrl}
                </a>
              </div>
              <div>
                <p className="detail-label">Expiry</p>
                <span>{details.link.expiresAt ? new Date(details.link.expiresAt).toLocaleString() : "No expiry"}</span>
              </div>
              <div>
                <p className="detail-label">QR code</p>
                {details.link.qrCodeDataUrl ? (
                  <img className="qr-preview" src={details.link.qrCodeDataUrl} alt="QR code for short link" />
                ) : (
                  <span>QR unavailable</span>
                )}
              </div>
            </div>
          </div>

          <div className="stack">
            <section className="panel">
              <div className="panel__header">
                <h2>Block IP for this link</h2>
              </div>
              <form className="stack-form" onSubmit={blockIp}>
                <input
                  className="input"
                  placeholder="IP address"
                  value={blockForm.ipAddress}
                  onChange={(event) => setBlockForm({ ...blockForm, ipAddress: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Reason, optional"
                  value={blockForm.reason}
                  onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
                />
                <button className="primary-button" type="submit">
                  Block IP
                </button>
              </form>
              <div className="list-stack">
                {details.blockedIps.map((item) => (
                  <div className="list-row" key={item.id}>
                    <div>
                      <strong>{item.ipAddress}</strong>
                      <p>{item.reason || "No reason provided"}</p>
                    </div>
                    <button className="link-button" onClick={() => unblockIp(item.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel__header">
          <h2>Visit analytics</h2>
          <span>{details?.visits?.length || 0} visits</span>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>IP</th>
                <th>Country</th>
                <th>Region</th>
                <th>City</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Device</th>
                <th>Visited</th>
              </tr>
            </thead>
            <tbody>
              {(details?.visits || []).map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.ipAddress}</td>
                  <td>{visit.country}</td>
                  <td>{visit.region}</td>
                  <td>{visit.city}</td>
                  <td>{visit.browser}</td>
                  <td>{visit.os}</td>
                  <td>{visit.deviceType}</td>
                  <td>{new Date(visit.visitedAt).toLocaleString()}</td>
                </tr>
              ))}
              {!details?.visits?.length ? (
                <tr>
                  <td colSpan="8" className="table__empty">
                    No visits recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
};

export default LinkDetailsPage;
