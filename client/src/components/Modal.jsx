const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
