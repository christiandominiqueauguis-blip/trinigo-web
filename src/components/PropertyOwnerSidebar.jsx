import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./PropertyOwnerSidebar.css";

export default function PropertyOwnerSidebar({
  active,
  disabled = false,
  isHidden,
}) {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("propertyOwnerProfileImage")
  );

  return (
    <aside
  className={`po-sidebar 
    ${disabled ? "po-sidebar-disabled" : ""} 
    ${isHidden ? "po-sidebar-hidden" : ""}
  `}
>

      {/* LOGO */}
      <h2 className="po-sidebar-logo">TriniGo</h2>

      {/* PROFILE */}
      <div className="po-sidebar-profile">
        <div className="po-avatar-wrapper">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="po-avatar-img"
            />
          ) : (
            <div className="po-default-avatar">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#777" />
                <path
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                  fill="#777"
                />
              </svg>
            </div>
          )}

          <label htmlFor="poUpload" className="po-camera">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 4L7.5 6H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-2.5L15 4H9z"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle
                cx="12"
                cy="13"
                r="3"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </label>

          <input
            type="file"
            id="poUpload"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const imageURL = URL.createObjectURL(file);
                setProfileImage(imageURL);
                localStorage.setItem(
                  "propertyOwnerProfileImage",
                  imageURL
                );
              }
            }}
          />
        </div>

        <p className="po-sidebar-name">
  {localStorage.getItem("propertyOwnerName")}
</p>

        <span className="po-sidebar-role">Property Owner</span>
      </div>

      {/* NAV */}
<nav className="po-sidebar-nav">

  <Link
    to="/property-owner/dashboard"
    className={active === "dashboard" ? "active" : ""}
  >
    Dashboard
  </Link>

  <Link
  to="/property-owner/create-accommodation"
  className={active === "accommodations" ? "active" : ""}
>
  My Accommodations
</Link>

  <Link
    to="/property-owner/booking-requests"
    className={active === "booking-requests" ? "active" : ""}
  >
    Bookings
  </Link>

  <Link
    to="/property-owner/feedback"
    className={active === "feedback" ? "active" : ""}
  >
    Feedback
  </Link>

  <Link
    to="/property-owner/reports"
    className={active === "reports" ? "active" : ""}
  >
    Reports
  </Link>

</nav>

      {/* LOG OUT */}
      <button
        className="po-sidebar-logout"
        onClick={() => navigate("/property-owner/login")}
      >
        Log out
      </button>

    </aside>
  );
}