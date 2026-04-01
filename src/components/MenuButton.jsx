import "./MenuButton.css";

export default function MenuButton({ onClick, className = "", label = "Open sidebar" }) {
  return (
    <button
      type="button"
      className={`menu-button ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
    >
      <span className="menu-button__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="menu-button__text">Menu</span>
    </button>
  );
}
