import { useState } from "react";
import "../styles/Sidebar.css";
import { Link, useNavigate } from "react-router-dom";

export default function Sidebar({ active, isHidden, setIsHidden }) {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(
  localStorage.getItem("adminProfileImage")
);

  return (
    <aside className={`sidebar ${isHidden ? "hidden" : ""}`}>

      <h2 className="sidebar-logo">TriniGo</h2>

      <div className="sidebar-profile">
        <div className="sidebar-avatar-wrapper">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="sidebar-avatar-img"
            />
          ) : (
            <div className="sidebar-default-avatar">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="8" r="4" fill="#777" />
                <path
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                  fill="#777"
                />
              </svg>
            </div>
          )}

          <label htmlFor="sidebarUpload" className="sidebar-camera">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
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
            id="sidebarUpload"
            accept="image/*"
            hidden
            onChange={(e) => {
  const file = e.target.files[0];
  if (file) {
    const imageURL = URL.createObjectURL(file);

    setProfileImage(imageURL);
    localStorage.setItem("adminProfileImage", imageURL);
  }
}}
          />
        </div>

        <p className="sidebar-name">
  {localStorage.getItem("adminFullName") || ""}
</p>
        <span className="sidebar-role">Tourism Officer</span>
      </div>

      <nav className="sidebar-nav">
        <Link
  to="/admin/dashboard"
  className={active === "dashboard" ? "active" : ""}
>
  Dashboard
</Link>
        <Link
  to="/admin/tourist-spots"
  className={active === "tourist-spots" ? "active" : ""}
>
  Tourist Spots
</Link>
        <Link
  to="/admin/property-owner-application"
  className={active === "property" ? "active" : ""}
>
  Property Owner Application
</Link>
        <Link
  to="/admin/feedback"
  className={active === "feedback" ? "active" : ""}
>
  Feedback
</Link>
        <Link
  to="/admin/report"
  className={active === "report" ? "active" : ""}
>
  Report
</Link>
      </nav>

      <button
  className="sidebar-logout"
  onClick={() => {
    navigate("/admin/login");
  }}
>
  Log out
</button>
    </aside>
  );
}