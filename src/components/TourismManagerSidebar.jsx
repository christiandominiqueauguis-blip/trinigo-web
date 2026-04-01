import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./PropertyOwnerSidebar.css";
import { clearRoleSession } from "../features/auth/roleSession";

export default function TourismManagerSidebar({
  active,
  isHidden,
  setIsHidden,
}) {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("tourismManagerProfileImage")
  );
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfileImage(imageURL);
      localStorage.setItem("tourismManagerProfileImage", imageURL);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleLogout = () => {
    clearRoleSession("tourismManager");
    navigate("/");
  };

  return (
    <>
      <aside className={`po-sidebar ${isHidden ? "po-sidebar-hidden" : ""}`}>

        {/* CLOSE BURGER BUTTON */}
        {setIsHidden && (
          <button
            className="po-sidebar-close-btn"
            onClick={() => setIsHidden(true)}
            aria-label="Close sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <div className="po-sidebar-scroll">

        {/* LOGO */}
        <h2 className="po-sidebar-logo">TriniGo</h2>

        {/* PROFILE */}
        <div className="po-sidebar-profile">
          <div className="po-avatar-wrapper">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="po-avatar-img" />
            ) : (
              <div className="po-default-avatar">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="#777" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#777" />
                </svg>
              </div>
            )}

            <label htmlFor="tmUpload" className="po-camera">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 4L7.5 6H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-2.5L15 4H9z"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="13" r="3" stroke="white" strokeWidth="1.5" />
              </svg>
            </label>

            <input
              type="file"
              id="tmUpload"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </div>

          <p className="po-sidebar-name">
            {localStorage.getItem("tourismManagerFullName")}
          </p>
          <span className="po-sidebar-role">Tourism Site Manager</span>
        </div>

        {/* NAV */}
        <nav className="po-sidebar-nav">
          <Link to="/tourism-site-manager/dashboard" className={active === "dashboard" ? "active" : ""}>
            Dashboard
          </Link>
        </nav>

        </div>{/* end po-sidebar-scroll */}

        {/* LOG OUT */}
        <button className="po-sidebar-logout" onClick={() => setShowLogoutModal(true)}>
          Log out
        </button>
      </aside>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="po-logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="po-logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="po-logout-modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 17l5-5-5-5M21 12H9M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="po-logout-modal-title">Log out?</h3>
            <p className="po-logout-modal-message">
              Are you sure you want to log out of your account?
            </p>
            <div className="po-logout-modal-actions">
              <button className="po-logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="po-logout-confirm-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE UPLOAD TOAST */}
      <div className={`po-sidebar-toast ${showToast ? "show" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#116735" />
          <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Profile photo updated successfully!
      </div>
    </>
  );
}
