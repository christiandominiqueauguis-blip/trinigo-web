import "./MessageModal.css";
import { useEffect } from "react";

export default function MessageModal({
  show,
  message,
  onClose,
  showButton = true,
  autoClose = false,
  duration = 5000,
}) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <p>{message}</p>

        {showButton && (
          <button onClick={onClose}>OK</button>
        )}
      </div>
    </div>
  );
}