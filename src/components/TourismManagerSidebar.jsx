import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PropertyOwnerSidebar.css";
import { API_URL } from "../config/api";
import { buildAuthHeaders, clearRoleSession } from "../features/auth/roleSession";
import {
  applyTourismManagerNotificationState,
  buildTourismManagerNotifications,
} from "../features/tourismManager/notificationState";

function getStoredManagerProfile() {
  return {
    id: localStorage.getItem("tourismManagerId") || "",
    fullName: localStorage.getItem("tourismManagerFullName") || "Tourism Site Manager",
    profileImage: localStorage.getItem("tourismManagerProfileImage") || "",
  };
}

export default function TourismManagerSidebar({
  active,
  disabled = false,
  isHidden,
  setIsHidden,
}) {
  const navigate = useNavigate();
  const [managerProfile, setManagerProfile] = useState(getStoredManagerProfile());
  const [notifications, setNotifications] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const syncProfile = () => setManagerProfile(getStoredManagerProfile());
    syncProfile();
    window.addEventListener("storage", syncProfile);
    return () => window.removeEventListener("storage", syncProfile);
  }, []);

  useEffect(() => {
    const managerId = localStorage.getItem("tourismManagerId") || "";
    if (!managerId) return;

    const loadNotifications = () => {
      fetch(`${API_URL}/tourist-spot-reports`, {
        headers: buildAuthHeaders("tourismManager"),
      })
        .then((response) => response.json())
        .then((data) => {
          const built = buildTourismManagerNotifications(Array.isArray(data) ? data : [], managerId);
          setNotifications(applyTourismManagerNotificationState(built, managerId));
        })
        .catch(() => {
          setNotifications([]);
        });
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleLogout = () => {
    clearRoleSession("tourismManager");
    navigate("/");
  };

  const handleNavClick = () => {
    if (!setIsHidden || typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 960px)").matches) {
      setIsHidden(true);
    }
  };

  return (
    <>
      <aside
        className={`po-sidebar ${disabled ? "po-sidebar-disabled" : ""} ${isHidden ? "po-sidebar-hidden" : ""}`}
      >
        {setIsHidden ? (
          <button
            type="button"
            className="po-sidebar-close-btn"
            onClick={() => setIsHidden(true)}
            aria-label="Close sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        ) : null}

        <div className="po-sidebar-scroll">
          <div className="po-sidebar-top">
            <h2 className="po-sidebar-logo">TriniGo</h2>
          </div>

          <div className="po-sidebar-profile-card">
            <div className="po-avatar-wrapper">
              {managerProfile.profileImage ? (
                <img
                  src={managerProfile.profileImage}
                  alt="Tourism manager profile"
                  className="po-avatar-img"
                  onError={() => {
                    localStorage.removeItem("tourismManagerProfileImage");
                    setManagerProfile((current) => ({ ...current, profileImage: "" }));
                  }}
                />
              ) : (
                <div className="po-default-avatar">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#777" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#777" />
                  </svg>
                </div>
              )}
            </div>

            <div className="po-sidebar-profile-copy">
              <p className="po-sidebar-name">{managerProfile.fullName}</p>
              <span className="po-sidebar-role">Tourism Site Manager</span>
            </div>
          </div>

          <nav className="po-sidebar-nav">
            <Link to="/tourism-site-manager/dashboard" className={active === "dashboard" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              Dashboard
            </Link>

            <p className="po-nav-label">Management</p>

            <Link to="/tourism-site-manager/guests" className={active === "guests" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              Guests
            </Link>

            <Link to="/tourism-site-manager/bookings" className={active === "bookings" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8V6a2 2 0 0 0-2-2h-3V2" />
                  <path d="M8 2v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
                  <path d="M3 10h18" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M16 18h6" />
                  <path d="M19 15v6" />
                </svg>
              </span>
              Bookings
            </Link>

            <p className="po-nav-label">Insights</p>

            <Link to="/tourism-site-manager/notifications" className={active === "notifications" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                  <path d="M9 17a3 3 0 0 0 6 0" />
                </svg>
              </span>
              Notifications
              {unreadCount ? <span className="po-nav-badge">{unreadCount}</span> : null}
            </Link>

            <Link to="/tourism-site-manager/income" className={active === "income" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              Income
            </Link>

            <Link to="/tourism-site-manager/feedback" className={active === "feedback" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              Feedback
            </Link>

            <Link to="/tourism-site-manager/reports" className={active === "reports" ? "active" : ""} onClick={handleNavClick}>
              <span className="po-nav-icon">
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

        <button className="po-sidebar-logout" onClick={() => setShowLogoutModal(true)}>
          Log out
        </button>
      </aside>

      {showLogoutModal ? (
        <div className="po-logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="po-logout-modal" onClick={(event) => event.stopPropagation()}>
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
      ) : null}
    </>
  );
}
