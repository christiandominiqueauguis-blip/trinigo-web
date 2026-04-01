import { useEffect, useRef, useState } from "react";
import MenuButton from "../../components/MenuButton";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import {
  buildOwnerProfileImage,
  saveOwnerSession,
} from "../../features/propertyOwner/propertyOwnerSession";
import "./Profile.css";

export default function Profile() {
  const ownerId = localStorage.getItem("ownerId") || "";
  const ownerEmail = localStorage.getItem("ownerEmail") || "";

  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: "success" | "error" }
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    email: "",
    phone: "",
  });

  const [ownerStatus, setOwnerStatus] = useState("");

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!ownerId && !ownerEmail) {
      setIsLoading(false);
      return;
    }

    const applyProfile = (data) => {
      setForm({
        fullName: data.fullName || "",
        gender: data.gender || "",
        email: data.email || "",
        phone: data.phone || "",
      });
      setOwnerStatus(data.status || "");
      setProfilePreview(buildOwnerProfileImage(data.profileImage));
      saveOwnerSession(data);
    };

    const loadProfile = async () => {
      try {
        if (ownerId) {
          const response = await fetch(`${API_URL}/property-owner/profile/${ownerId}`, {
            headers: buildAuthHeaders("propertyOwner"),
          });
          if (response.ok) {
            const data = await response.json();
            applyProfile(data);
            return;
          }
        }

        if (ownerEmail) {
          const fallbackResponse = await fetch(
            `${API_URL}/property-owner/status?email=${encodeURIComponent(ownerEmail)}`,
            { headers: buildAuthHeaders("propertyOwner") }
          );
          if (!fallbackResponse.ok) throw new Error("Profile lookup failed");
          const fallbackData = await fallbackResponse.json();
          applyProfile(fallbackData);
          return;
        }

        throw new Error("No owner session found");
      } catch (error) {
        console.error(error);
        setToast({ message: "Unable to load your profile. Please refresh.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [ownerEmail, ownerId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setProfileImageFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (event) => {
    applyImageFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    applyImageFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ownerId) return;

    setIsSaving(true);
    setToast(null);

    try {
      const payload = new FormData();
      payload.append("fullName", form.fullName.trim());
      payload.append("gender", form.gender);
      payload.append("email", form.email.trim());
      payload.append("phone", form.phone.trim());

      if (profileImageFile) {
        payload.append("profileImage", profileImageFile);
      }

      const response = await fetch(`${API_URL}/property-owner/profile/${ownerId}`, {
        method: "PATCH",
        headers: buildAuthHeaders("propertyOwner"),
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        setToast({ message: data.message || "Unable to update your profile.", type: "error" });
        return;
      }

      saveOwnerSession(data.owner);
      setProfilePreview(buildOwnerProfileImage(data.owner.profileImage));
      setProfileImageFile(null);
      setOwnerStatus(data.owner.status || ownerStatus);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Unable to update your profile right now.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    form.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "PO";

  const filledFields = [form.fullName, form.gender, form.email, form.phone].filter(Boolean).length;
  const completionPct = Math.round((filledFields / 4) * 100);

  const statusLabel = {
    VERIFIED: "Verified",
    PENDING: "Pending",
    REJECTED: "Rejected",
  }[ownerStatus] || ownerStatus;

  const statusClass = {
    VERIFIED: "op-status--verified",
    PENDING: "op-status--pending",
    REJECTED: "op-status--rejected",
  }[ownerStatus] || "";

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="profile"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main op-main">
        {/* Toast */}
        {toast && (
          <div className={`op-toast op-toast--${toast.type}`}>
            <span className="op-toast-icon">{toast.type === "success" ? "✓" : "!"}</span>
            <span>{toast.message}</span>
            <button className="op-toast-close" onClick={() => setToast(null)}>×</button>
          </div>
        )}

        <div className="op-shell">
          {/* Page header */}
          <header className="op-page-header">
            {sidebarHidden && <MenuButton onClick={() => setSidebarHidden(false)} />}
            <div className="op-page-header-copy">
              <span className="op-kicker">Account</span>
              <h1>My Profile</h1>
              <p>Manage your personal details and keep your account up to date.</p>
            </div>
          </header>

          {isLoading ? (
            <div className="op-skeleton-wrap">
              <div className="op-skeleton op-skeleton--hero" />
              <div className="op-skeleton op-skeleton--form" />
            </div>
          ) : (
            <form className="op-form-card" onSubmit={handleSubmit}>

              {/* ── Hero section ── */}
              <div className="op-hero">
                <div className="op-hero-cover" />

                <div className="op-hero-body">
                  {/* Avatar with upload overlay */}
                  <div
                    className={`op-avatar-wrap${isDragging ? " op-avatar-wrap--drag" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    title="Click or drag an image to change photo"
                  >
                    {profilePreview ? (
                      <img className="op-avatar-img" src={profilePreview} alt="Profile" />
                    ) : (
                      <div className="op-avatar-fallback">{initials}</div>
                    )}
                    <div className="op-avatar-overlay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span>{profileImageFile ? "Photo selected" : "Change photo"}</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />
                  </div>

                  {/* Identity */}
                  <div className="op-hero-identity">
                    <div className="op-hero-name-row">
                      <h2>{form.fullName || "Your Name"}</h2>
                      {ownerStatus && (
                        <span className={`op-status-badge ${statusClass}`}>{statusLabel}</span>
                      )}
                    </div>
                    <p className="op-hero-email">{form.email || "No email set"}</p>

                    <div className="op-hero-chips">
                      {form.phone && (
                        <span className="op-chip">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
                          {form.phone}
                        </span>
                      )}
                      {form.gender && (
                        <span className="op-chip">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {form.gender}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completion */}
                  <div className="op-completion">
                    <div className="op-completion-label">
                      <span>Profile completion</span>
                      <strong>{completionPct}%</strong>
                    </div>
                    <div className="op-completion-bar">
                      <div
                        className="op-completion-fill"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    {completionPct < 100 && (
                      <p className="op-completion-hint">
                        Fill in all fields to complete your profile.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Form section ── */}
              <div className="op-section">
                <div className="op-section-head">
                  <h3>Personal Information</h3>
                  <p>This information is displayed to administrators and used for bookings.</p>
                </div>

                <div className="op-grid">
                  <label className="op-field">
                    <span className="op-field-label">Full Name</span>
                    <div className="op-field-input-wrap">
                      <svg className="op-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </label>

                  <label className="op-field">
                    <span className="op-field-label">Gender</span>
                    <div className="op-field-input-wrap">
                      <svg className="op-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                      <select name="gender" value={form.gender} onChange={handleChange} required>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to specify">Prefer not to specify</option>
                      </select>
                    </div>
                  </label>

                  <label className="op-field">
                    <span className="op-field-label">Email Address</span>
                    <div className="op-field-input-wrap">
                      <svg className="op-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </label>

                  <label className="op-field">
                    <span className="op-field-label">Phone Number</span>
                    <div className="op-field-input-wrap">
                      <svg className="op-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="e.g. +1 868 xxx xxxx"
                        required
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* ── Account info (read-only) ── */}
              <div className="op-section op-section--info">
                <div className="op-section-head">
                  <h3>Account Details</h3>
                  <p>These details are managed by the system and cannot be edited here.</p>
                </div>
                <div className="op-info-grid">
                  <div className="op-info-card">
                    <span>Owner ID</span>
                    <strong className="op-info-mono">{ownerId || "—"}</strong>
                  </div>
                  <div className="op-info-card">
                    <span>Account Status</span>
                    <strong>
                      {ownerStatus ? (
                        <span className={`op-status-badge op-status-badge--sm ${statusClass}`}>
                          {statusLabel}
                        </span>
                      ) : "—"}
                    </strong>
                  </div>
                  <div className="op-info-card">
                    <span>Role</span>
                    <strong>Property Owner</strong>
                  </div>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="op-actions">
                <div className="op-actions-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Changes will sync across your dashboard immediately.
                </div>
                <button type="submit" className="op-save-btn" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <span className="op-save-spinner" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </main>
    </div>
  );
}
