import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import { API_URL } from "../config/api";
import { buildAuthHeaders, clearRoleSession } from "../features/auth/roleSession";

function getStoredAdminProfile() {
  return {
    id: localStorage.getItem("adminId") || "",
    fullName: localStorage.getItem("fullName") || "Administrator",
    profileImage: localStorage.getItem("adminProfileImage") || "",
    token: localStorage.getItem("adminAuthToken") || "",
  };
}

export default function Sidebar({ active, isHidden, setIsHidden, disabled = false }) {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState(getStoredAdminProfile());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const closeSidebar = () => setIsHidden?.(true);

  const handleNavItemClick = () => {
    if (!setIsHidden || typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 960px)").matches) {
      setIsHidden(true);
    }
  };

  useEffect(() => {
    const syncProfile = () => setAdminProfile(getStoredAdminProfile());
    syncProfile();
    window.addEventListener("storage", syncProfile);
    return () => window.removeEventListener("storage", syncProfile);
  }, []);

  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;

    fetch(`${API_URL}/admin/${adminId}`, {
      headers: buildAuthHeaders("admin"),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        const nextProfile = {
          id: String(data._id || data.id || adminId),
          fullName: data.fullName || "Administrator",
          profileImage: data.profileImage || localStorage.getItem("adminProfileImage") || "",
        };

        localStorage.setItem("fullName", nextProfile.fullName);
        if (nextProfile.profileImage) {
          localStorage.setItem("adminProfileImage", nextProfile.profileImage);
        }

        setAdminProfile(nextProfile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!setIsHidden || isHidden || typeof window === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    const isSmallScreen = window.matchMedia("(max-width: 960px)").matches;

    if (isSmallScreen) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsHidden(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHidden, setIsHidden]);

  const handleLogout = () => {
    clearRoleSession("admin");
    navigate("/");
  };

  const profileImage = adminProfile.profileImage;

  return (
    <>
      {setIsHidden && !isHidden ? (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={`sidebar ${disabled ? "sidebar-disabled" : ""} ${isHidden ? "hidden" : ""}`}
        aria-hidden={isHidden}
      >
        {setIsHidden ? (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        ) : null}

        <div className="sidebar-scroll">
          <div className="sidebar-top">
            <h2 className="sidebar-logo">TriniGo</h2>
          </div>

          <div className="sidebar-profile-card">
            <div className="sidebar-avatar-wrapper">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Admin profile"
                  className="sidebar-avatar-img"
                  onError={() => {
                    localStorage.removeItem("adminProfileImage");
                    setAdminProfile((current) => ({ ...current, profileImage: "" }));
                  }}
                />
              ) : (
                <div className="sidebar-default-avatar">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#777" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#777" />
                  </svg>
                </div>
              )}
            </div>

            <div className="sidebar-profile-copy">
              <p className="sidebar-name">{adminProfile.fullName}</p>
              <span className="sidebar-role">Administrator</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <Link to="/admin/dashboard" className={active === "dashboard" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              Dashboard
            </Link>

            <p className="sidebar-nav-label">Management</p>

            <Link to="/admin/tourist-spots" className={active === "tourist-spots" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l4 7h-8l4-7z" />
                  <path d="M5 10l4 12H1L5 10z" />
                  <path d="M19 10l4 12h-8l4-12z" />
                </svg>
              </span>
              Tourist Spots
            </Link>

            <Link to="/admin/accommodations" className={active === "accommodations" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </span>
              Accommodations
            </Link>

            <Link to="/admin/property-owner-application" className={active === "property" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              Establishment Application
            </Link>

            <Link to="/admin/user-management" className={active === "user-management" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              User Management
            </Link>

            <p className="sidebar-nav-label">Insights</p>

            <Link to="/admin/feedback" className={active === "feedback" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              Feedback
            </Link>

            <Link to="/admin/report" className={active === "report" ? "active" : ""} onClick={handleNavItemClick}>
              <span className="sidebar-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              Reports
            </Link>
          </nav>
        </div>

        <button className="sidebar-logout" onClick={() => setShowLogoutModal(true)}>
          Log out
        </button>
      </aside>

      {showLogoutModal ? (
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(event) => event.stopPropagation()}>
            <div className="logout-modal-icon">
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
            <h3 className="logout-modal-title">Log out?</h3>
            <p className="logout-modal-message">Are you sure you want to log out of your account?</p>
            <div className="logout-modal-actions">
              <button className="logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="logout-confirm-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
