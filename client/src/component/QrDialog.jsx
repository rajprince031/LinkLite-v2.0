import { toast } from "react-toastify";

const QrDialog = ({ link, onClose }) => {
  if (!link) return null;

  const downloadQrImage = async () => {
    try {
      const response = await fetch(link.qrCodeDataUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(link.title || "linklite-qr").replace(/\s+/g, "-").toLowerCase()}.png`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download QR image");
    }
  };

  const shareQrImage = async () => {
    try {
      const response = await fetch(link.qrCodeDataUrl);
      const blob = await response.blob();
      const file = new File([blob], "linklite-qr.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: link.title,
          text: link.shortUrl,
          files: [file]
        });
        return;
      }

      await navigator.clipboard.writeText(link.shortUrl);
      toast.success("Link copied for sharing");
    } catch {
      toast.error("Unable to share QR image");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      toast.success("Short link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  return (
    <div className="workspace_modal_overlay" onClick={onClose}>
      <div className="workspace_modal_card workspace_qr_modal_card workspace_qr_modal_dark" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="workspace_qr_close" onClick={onClose}>×</button>
        <div className="workspace_qr_brand">
          <div className="workspace_qr_brand_badge">LL</div>
          <div>
            <strong title={link.title}>{link.title}</strong>
            <span>Generated short link QR</span>
          </div>
        </div>

        <div className="workspace_qr_stage">
          <div className="workspace_qr_stage_inner">
            <img className="workspace_qr_preview" src={link.qrCodeDataUrl} alt={link.title} />
            <div className="workspace_qr_logo_overlay">LL</div>
          </div>
        </div>

        <div className="workspace_qr_link_box workspace_qr_link_dark">
          <a href={link.shortUrl} target="_blank" rel="noreferrer" title={link.shortUrl}>{link.shortUrl}</a>
          <button type="button" className="workspace_qr_icon_button" onClick={copyLink} aria-label="Copy short link">
            ⧉
          </button>
        </div>

        <div className="workspace_qr_action_bar">
          <button type="button" className="workspace_qr_dark_button" onClick={downloadQrImage}>Download</button>
          <button type="button" className="workspace_qr_dark_button" onClick={shareQrImage}>Share</button>
        </div>
      </div>
    </div>
  );
};

export default QrDialog;
