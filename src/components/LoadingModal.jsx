import "./LoadingModal.css";

export default function LoadingModal({
  show,
  text = "Loading...",
  showText = true,
}) {
  if (!show) return null;

  return (
    <div className="loading-backdrop">
      <div className="loading-modal">
        <div className="spinner"></div>

        {showText && <p>{text}</p>}
      </div>
    </div>
  );
}