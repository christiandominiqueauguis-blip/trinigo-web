import "./PendingApproval.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

const POLL_INTERVAL = 5000; // 5 seconds
const REDIRECT_COUNTDOWN = 5;

export default function PendingApproval() {
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingOwnerEmail");

  const [status, setStatus] = useState("PENDING");
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN);
  const [dots, setDots] = useState(".");
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const dotsRef = useRef(null);

  // If no email in localStorage, we can't poll
  const hasEmail = Boolean(email);

  useEffect(() => {
    if (!hasEmail) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/property-owner/status?email=${encodeURIComponent(email)}`);
        if (!res.ok) return;
        const data = await res.json();
        setOwnerInfo(data);
        setStatus(data.status);
      } catch {
        // silently retry on next interval
      }
    };

    // Initial fetch immediately
    fetchStatus();

    // Poll every 5 seconds
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL);

    // Animated dots for "Checking status"
    dotsRef.current = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(dotsRef.current);
    };
  }, [hasEmail, email]);

  // When status becomes VERIFIED, start countdown
  useEffect(() => {
    if (status !== "VERIFIED") return;

    clearInterval(intervalRef.current);
    clearInterval(dotsRef.current);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          localStorage.removeItem("pendingOwnerEmail");
          navigate("/property-owner/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [status, navigate]);

  const registrationDate = ownerInfo?.createdAt
    ? new Date(ownerInfo.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const ownerName = ownerInfo?.fullName || localStorage.getItem("propertyOwnerName") || "—";

  // ── NO EMAIL / SESSION LOST ──
  if (!hasEmail) {
    return (
      <div className="pa-wrapper">
        <div className="pa-card">
          <img src={trinigoLogo} className="pa-logo" alt="TriniGo" />
          <div className="pa-session-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="pa-title">Session Not Found</h2>
          <p className="pa-desc">
            We couldn't find your registration session. Please log in to check
            your application status.
          </p>
          <button className="pa-login-btn" onClick={() => navigate("/property-owner/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── VERIFIED ──
  if (status === "VERIFIED") {
    return (
      <div className="pa-wrapper">
        <div className="pa-card pa-card--verified">
          <img src={trinigoLogo} className="pa-logo" alt="TriniGo" />

          <div className="pa-check-circle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <div className="pa-verified-badge">Verified</div>

          <h2 className="pa-verified-title">You're Approved!</h2>

          <p className="pa-desc">
            Congratulations, <strong>{ownerName}</strong>! Your property owner
            account has been verified by our Tourism Officer. You can now log in
            and start listing your accommodations.
          </p>

          <div className="pa-info-box pa-info-box--green">
            <div className="pa-info-row">
              <span className="pa-info-label">Account Name</span>
              <span className="pa-info-value">{ownerName}</span>
            </div>
            <div className="pa-info-row">
              <span className="pa-info-label">Registered On</span>
              <span className="pa-info-value">{registrationDate}</span>
            </div>
            <div className="pa-info-row">
              <span className="pa-info-label">Status</span>
              <span className="pa-info-value pa-badge pa-badge--verified">Verified ✓</span>
            </div>
          </div>

          <div className="pa-countdown-text">
            Redirecting to Login in <strong>{countdown}s</strong>…
          </div>

          <button
            className="pa-login-btn pa-login-btn--verified"
            onClick={() => {
              clearInterval(countdownRef.current);
              localStorage.removeItem("pendingOwnerEmail");
              navigate("/property-owner/login");
            }}
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // ── REJECTED ──
  if (status === "REJECTED") {
    return (
      <div className="pa-wrapper">
        <div className="pa-card pa-card--rejected">
          <img src={trinigoLogo} className="pa-logo" alt="TriniGo" />

          <div className="pa-x-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <div className="pa-rejected-badge">Application Rejected</div>
          <h2 className="pa-title">Application Not Approved</h2>
          <p className="pa-desc">
            We're sorry, <strong>{ownerName}</strong>. Your property owner
            application was not approved at this time. Please contact our
            support team for more information.
          </p>

          <button
            className="pa-login-btn"
            onClick={() => {
              localStorage.removeItem("pendingOwnerEmail");
              navigate("/");
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── PENDING (default) ──
  return (
    <div className="pa-wrapper">
      <div className="pa-card">
        <img src={trinigoLogo} className="pa-logo" alt="TriniGo" />

        <div className="pa-clock-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#116735" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <div className="pa-pending-badge">Pending Review</div>

        <h2 className="pa-title">Application Under Review</h2>

        <p className="pa-desc">
          Thank you for registering, <strong>{ownerName}</strong>. Your
          application is currently being reviewed by our Tourism Officer.
          Please wait while we verify your submitted documents.
        </p>

        <div className="pa-info-box">
          <div className="pa-info-row">
            <span className="pa-info-label">Account Name</span>
            <span className="pa-info-value">{ownerName}</span>
          </div>
          <div className="pa-info-row">
            <span className="pa-info-label">Registered On</span>
            <span className="pa-info-value">{registrationDate}</span>
          </div>
          <div className="pa-info-row">
            <span className="pa-info-label">Status</span>
            <span className="pa-info-value pa-badge pa-badge--pending">Pending</span>
          </div>
        </div>

        <div className="pa-steps">
          <p className="pa-steps-title">What happens next?</p>
          <div className="pa-step">
            <span className="pa-step-num">1</span>
            <span>Our Tourism Officer reviews your submitted documents.</span>
          </div>
          <div className="pa-step">
            <span className="pa-step-num">2</span>
            <span>Your account status is updated to Verified upon approval.</span>
          </div>
          <div className="pa-step">
            <span className="pa-step-num">3</span>
            <span>You'll be notified here automatically — no need to refresh!</span>
          </div>
        </div>

        <div className="pa-polling-indicator">
          <span className="pa-poll-dot" />
          Checking status{dots}
        </div>

        <p className="pa-note">
          Expected review time: <strong>Within 1 hour</strong>. You can safely
          close this tab and log in later to check your status.
        </p>
      </div>
    </div>
  );
}
