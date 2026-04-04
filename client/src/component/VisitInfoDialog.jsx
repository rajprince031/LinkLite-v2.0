import { toast } from "react-toastify";

const VisitInfoDialog = ({ visit, onClose }) => {
  if (!visit) return null;

  const detailsText = [
    `Link title: ${visit.linkTitle || "Unknown"}`,
    `Alias: ${visit.alias || "Unknown"}`,
    `Short URL: ${visit.shortUrl || "Unknown"}`,
    `Destination URL: ${visit.targetUrl || "Unknown"}`,
    `IP address: ${visit.ipAddress || "Unknown"}`,
    `Country: ${visit.country || "Unknown"}`,
    `Region: ${visit.region || "Unknown"}`,
    `City: ${visit.city || "Unknown"}`,
    `Browser: ${visit.browser || "Unknown"}`,
    `OS: ${visit.os || "Unknown"}`,
    `Device: ${visit.deviceType || "Unknown"}`,
    `User Agent: ${visit.userAgent || "Unknown"}`,
    `Referrer: ${visit.referrer || "Direct"}`,
    `Blocked: ${visit.blocked ? "Yes" : "No"}`,
    `Visited At: ${new Date(visit.timestamp || visit.visitedAt).toLocaleString()}`
  ].join("\n");

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(detailsText);
      toast.success("Visit details copied");
    } catch {
      toast.error("Unable to copy details");
    }
  };

  const downloadDetails = () => {
    const blob = new Blob([detailsText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(visit.linkTitle || "visit-details").replace(/\s+/g, "-").toLowerCase()}.txt`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const shareDetails = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${visit.linkTitle || "Visit"} details`,
          text: detailsText
        });
        return;
      }
      await navigator.clipboard.writeText(detailsText);
      toast.success("Visit details copied for sharing");
    } catch {
      toast.error("Unable to share details");
    }
  };

  const rows = [
    ["Link title", visit.linkTitle],
    ["Alias", visit.alias],
    ["Short URL", visit.shortUrl],
    ["Destination", visit.targetUrl],
    ["IP address", visit.ipAddress],
    ["Country", visit.country],
    ["Region", visit.region],
    ["City", visit.city],
    ["Browser", visit.browser],
    ["OS", visit.os],
    ["Device", visit.deviceType],
    ["User Agent", visit.userAgent],
    ["Referrer", visit.referrer || "Direct"],
    ["Blocked", visit.blocked ? "Yes" : "No"],
    ["Visited At", new Date(visit.timestamp || visit.visitedAt).toLocaleString()]
  ];

  return (
    <div className="workspace_modal_overlay" onClick={onClose}>
      <div className="workspace_modal_card workspace_visit_modal" onClick={(event) => event.stopPropagation()}>
        <h3>Visit Details</h3>
        <div className="workspace_visit_grid">
          {rows.map(([label, value]) => (
            <div key={label} className="workspace_visit_item">
              <span>{label}</span>
              <strong>{value || "Unknown"}</strong>
            </div>
          ))}
        </div>
        <div className="workspace_modal_actions">
          <button type="button" className="workspace_secondary_button" onClick={copyDetails}>Copy</button>
          <button type="button" className="workspace_secondary_button" onClick={downloadDetails}>Download</button>
          <button type="button" className="workspace_secondary_button" onClick={shareDetails}>Share</button>
          <button type="button" className="workspace_primary_button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default VisitInfoDialog;
