import "./Register.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal";

export default function PropertyOwnerRegister() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    email: "",
    phone: "",
    password: "",
    businessPermits: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permitPreviews, setPermitPreviews] = useState([]);
  const [permitNames, setPermitNames] = useState([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "businessPermits" && files) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      );
      const newNames = newFiles.map((file) => file.name);

      setFormData((prev) => ({
        ...prev,
        businessPermits: [...prev.businessPermits, ...newFiles],
      }));
      setPermitPreviews((prev) => [...prev, ...newPreviews]);
      setPermitNames((prev) => [...prev, ...newNames]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removePermit = (index) => {
    if (permitPreviews[index]) URL.revokeObjectURL(permitPreviews[index]);
    setFormData((prev) => ({
      ...prev,
      businessPermits: prev.businessPermits.filter((_, i) => i !== index),
    }));
    setPermitPreviews((prev) => prev.filter((_, i) => i !== index));
    setPermitNames((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const validationErrors = [];

    if (!formData.firstName.trim()) validationErrors.push("First name is required");
    if (!formData.lastName.trim()) validationErrors.push("Last name is required");
    if (!formData.gender) validationErrors.push("Please select a gender");
    if (!formData.email.trim()) validationErrors.push("Email address is required");
    if (!formData.phone.trim()) validationErrors.push("Phone number is required");

    const password = formData.password;
    if (!password) {
      validationErrors.push("Password is required");
    } else if (/\s/.test(password)) {
      validationErrors.push("Password must not contain spaces");
    } else if (password.length < 8) {
      validationErrors.push("Password must be at least 8 characters");
    } else if (!/[A-Z]/.test(password)) {
      validationErrors.push("Password must contain at least 1 uppercase letter");
    } else if (!/\d/.test(password)) {
      validationErrors.push("Password must contain at least 1 number");
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      validationErrors.push("Password must contain at least 1 symbol");
    }

    if (!confirmPassword) {
      validationErrors.push("Please confirm your password");
    } else if (password && confirmPassword !== password) {
      validationErrors.push("Passwords do not match");
    }

    if (formData.businessPermits.length === 0) {
      validationErrors.push("Please upload at least one business document");
    }

    if (validationErrors.length > 0) {
      validationErrors.forEach((msg, i) => {
        setTimeout(() => addToast(msg, "error"), i * 120);
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const data = new FormData();
    const fullName = [formData.firstName, formData.middleName, formData.lastName]
      .filter(Boolean)
      .join(" ");

    data.append("fullName", fullName);
    data.append("gender", formData.gender);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("password", formData.password);
    formData.businessPermits.forEach((file) => data.append("businessPermits", file));

    try {
      const res = await fetch(`${API_URL}/property-owner/register`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        setIsLoading(false);
        addToast(result.message || "Registration failed. Please try again.", "error");
        return;
      }

      localStorage.setItem(
        "propertyOwnerName",
        [formData.firstName, formData.middleName, formData.lastName]
          .filter(Boolean)
          .join(" ")
      );
      localStorage.setItem("pendingOwnerEmail", formData.email);

      setTimeout(() => {
        setIsLoading(false);
        addToast("Registration submitted successfully!", "success");

        setTimeout(() => {
          navigate("/property-owner/pending-approval", {
            state: { registrationDate: new Date().toISOString().split("T")[0] },
          });
        }, 1500);
      }, 1500);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      addToast("Network error. Please try again.", "error");
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <img src={trinigoLogo} className="register-logo" alt="TriniGo Logo" />

        <h2>Register as a Property Owner</h2>
        <p className="sub-text">
          Create your account to start listing your property on TriniGo.
        </p>

        <form onSubmit={handleSubmit}>
          {/* ── OWNER INFORMATION ── */}
          <div className="reg-section-header">
            <span className="reg-section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            Owner Information
          </div>

          <div className="row">
            <div className="field">
              <label>First Name <span className="req">*</span></label>
              <input
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Middle Name <span className="opt">(optional)</span></label>
              <input
                name="middleName"
                placeholder="Enter your middle name"
                value={formData.middleName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Last Name <span className="req">*</span></label>
              <input
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Gender <span className="req">*</span></label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to specify">Prefer not to specify</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Email Address <span className="req">*</span></label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Phone Number <span className="req">*</span></label>
              <input
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Password <span className="req">*</span></label>
              <div className="admin-password-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span className="admin-eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 5.1A9.1 9.1 0 0 1 12 5c6 0 10.5 7 10.5 7a18.5 18.5 0 0 1-4.3 4.9M6.2 6.2C3.5 8.4 1.5 12 1.5 12a18.5 18.5 0 0 0 10.5 7.5c1.4 0 2.8-.3 4-.8" />
                    </svg>
                  )}
                </span>
              </div>
              <p className="password-hint">
                Min. 8 chars · uppercase · number · symbol · no spaces.
              </p>
            </div>

            <div className="field">
              <label>Confirm Password <span className="req">*</span></label>
              <div className="admin-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span className="admin-eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 5.1A9.1 9.1 0 0 1 12 5c6 0 10.5 7 10.5 7a18.5 18.5 0 0 1-4.3 4.9M6.2 6.2C3.5 8.4 1.5 12 1.5 12a18.5 18.5 0 0 0 10.5 7.5c1.4 0 2.8-.3 4-.8" />
                    </svg>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="credentials-reminder">
            <strong>Reminder:</strong> Please save your <b>Email</b> and <b>Password</b>.
            You will use these credentials to log in via the{" "}
            <b>Establishment Owner Login</b> page.
          </div>

          {/* ── BUSINESS DOCUMENTS ── */}
          <div className="reg-section-header">
            <span className="reg-section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
            </span>
            Business Documents
          </div>

          <p className="doc-hint">
            Upload your business permits, DTI registration, or any relevant documents.
            Accepted formats: images &amp; PDF.
          </p>

          <label className="upload-box">
            <span className="upload-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </span>
            <span className="upload-label-text">Click to Upload Documents</span>
            <span className="upload-sub">Images or PDF files</span>
            <input
              type="file"
              name="businessPermits"
              hidden
              multiple
              accept="image/*,.pdf"
              onChange={handleChange}
            />
          </label>

          {permitPreviews.length > 0 && (
            <div className="permits-grid">
              {permitPreviews.map((preview, index) => (
                <div key={index} className="permit-item">
                  {preview ? (
                    <img src={preview} alt={`Document ${index + 1}`} />
                  ) : (
                    <div className="permit-pdf-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                      <span>{permitNames[index]}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => removePermit(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="note">
            <strong>Note:</strong> Your application will be reviewed and approved within
            minutes to an hour by the Tourism Officer. You will be notified once approved.
          </div>

          <div className="actions">
            <button type="submit">Submit Registration</button>
            <div className="login-section">
              <span className="login-text">Already registered?</span>
              <button type="button" onClick={() => navigate("/property-owner/login")}>
                Log In
              </button>
            </div>
          </div>
        </form>
      </div>

      <LoadingModal show={isLoading} text="Submitting registration..." />

      {/* ── TOAST STACK ── */}
      <div className="reg-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`reg-toast reg-toast--${t.type}`}>
            <span className="reg-toast-icon">
              {t.type === "success" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
