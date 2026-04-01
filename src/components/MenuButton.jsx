import "./MenuButton.css";

export default function MenuButton({ onClick }) {
  return (
    <button className="menu-button" onClick={onClick}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <line x1="3" y1="6" x2="21" y2="6" stroke="#116735" strokeWidth="2" />
        <line x1="3" y1="12" x2="21" y2="12" stroke="#116735" strokeWidth="2" />
        <line x1="3" y1="18" x2="21" y2="18" stroke="#116735" strokeWidth="2" />
      </svg>
    </button>
  );
}
