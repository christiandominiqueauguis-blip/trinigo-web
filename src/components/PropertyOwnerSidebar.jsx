import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./PropertyOwnerSidebar.css";
import { API_URL } from "../config/api";
import {
  buildOwnerProfileImage,
  clearOwnerSession,
  saveOwnerSession,
} from "../features/propertyOwner/propertyOwnerSession";
import { buildAuthHeaders } from "../features/auth/roleSession";

function getStoredOwnerProfile() {
  return {
    id: localStorage.getItem("ownerId") || "",
    fullName: localStorage.getItem("ownerFullName") || "Establishment Owner",
    email: localStorage.getItem("ownerEmail") || "",
    profileImage: localStorage.getItem("propertyOwnerProfileImage") || "",
  };
}

export default function PropertyOwnerSidebar({
  active,
  disabled = false,
  isHidden,
  setIsHidden,
}) {
  const navigate = useNavigate();
  const [ownerProfile, setOwnerProfile] = useState(getStoredOwnerProfile());
  const [notifications, setNotifications] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const syncProfile = () => setOwnerProfile(getStoredOwnerProfile());
    syncProfile();
    window.addEventListener("owner-profile-updated", syncProfile);
    return () => window.removeEventListener("owner-profile-updated", syncProfile);
  }, []);

  useEffect(() => {
    const ownerId = localStorage.getItem("ownerId");
    const ownerEmail = localStorage.getItem("ownerEmail");
    if (!ownerId && !ownerEmail) return;

    const syncOwnerProfile = (data) => {
      saveOwnerSession(data);
      setOwnerProfile({
        id: String(data.id || ""),
        fullName: data.fullName || "Establishment Owner",
        email: data.email || "",
        profileImage: data.profileImage || "",
      });
    };

    const loadOwnerProfile = async () => {
        try {
          if (ownerId) {
          const response = await fetch(`${API_URL}/property-owner/profile/${ownerId}`, {
            headers: buildAuthHeaders("propertyOwner"),
          });
            if (response.ok) {
              syncOwnerProfile(await response.json());
              return;
          }
        }

        if (ownerEmail) {
          const fallbackResponse = await fetch(
            `${API_URL}/property-owner/status?email=${encodeURIComponent(ownerEmail)}`
          );
          if (fallbackResponse.ok) {
            syncOwnerProfile(await fallbackResponse.json());
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadOwnerProfile();
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("ownerEmail");
    if (!email) return;

    fetch(`${API_URL}/property-owner/status?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "REJECTED") {
          clearOwnerSession();
          navigate("/property-owner/login", { state: { rejected: true } });
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const ownerId = localStorage.getItem("ownerId");
    if (!ownerId) return;

    const loadNotifications = () => {
      fetch(`${API_URL}/property-owner/${ownerId}/notifications`, {
        headers: buildAuthHeaders("propertyOwner"),
      })
        .then((response) => response.json())
        .then((data) => {
          setNotifications(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleLogout = () => {
    clearOwnerSession();
    navigate("/");
  };

  const profileImage = buildOwnerProfileImage(ownerProfile.profileImage);

  return (
    <>
      <aside
        className={`po-sidebar ${disabled ? "po-sidebar-disabled" : ""} ${isHidden ? "po-sidebar-hidden" : ""}`}
      >
        {setIsHidden ? (
          <button
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
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="po-avatar-img"
                  onError={() => {
                    localStorage.removeItem("propertyOwnerProfileImage");
                    setOwnerProfile((current) => ({ ...current, profileImage: "" }));
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
              <p className="po-sidebar-name">{ownerProfile.fullName}</p>
              <span className="po-sidebar-role">Establishment Owner</span>
            </div>
          </div>

          <nav className="po-sidebar-nav">
            <Link to="/property-owner/dashboard" className={active === "dashboard" ? "active" : ""}>
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

            <p className="po-nav-label">Property</p>

            <Link to="/property-owner/create-accommodation" className={active === "accommodations" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </span>
              My Accommodations
            </Link>

            <Link to="/property-owner/booking-requests" className={active === "booking-requests" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M9 16l2 2 4-4" />
                </svg>
              </span>
              Bookings
            </Link>

            <p className="po-nav-label">Insights</p>

            <Link to="/property-owner/notifications" className={active === "notifications" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                  <path d="M9 17a3 3 0 0 0 6 0" />
                </svg>
              </span>
              Notifications
              {unreadCount ? <span className="po-nav-badge">{unreadCount}</span> : null}
            </Link>

            <Link to="/property-owner/income" className={active === "income" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              Income
            </Link>

            <Link to="/property-owner/feedback" className={active === "feedback" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              Feedback
            </Link>

            <Link to="/property-owner/reports" className={active === "reports" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              Reports
            </Link>

            <p className="po-nav-label">Account</p>

            <Link to="/property-owner/profile" className={active === "profile" ? "active" : ""}>
              <span className="po-nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              Profile
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
