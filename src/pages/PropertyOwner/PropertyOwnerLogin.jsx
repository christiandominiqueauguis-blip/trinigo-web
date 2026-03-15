import "../Admin/AdminRegister.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";

export default function PropertyOwnerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/.test(email)) {
      newErrors.email = "Invalid email address format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
  if (!validateForm()) return;

  setIsLoading(true);

  try {
    const res = await fetch(`${API_URL}/property-owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setIsLoading(false);
      setModalMessage(data.message || "Login failed");
      setShowModal(true);
      return;
    }

    // ⏳ KEEP LOADING A BIT
    // ✅ success
setTimeout(() => {
  setIsLoading(false);

  setModalMessage("Login successful ✅");
  setShowModal(true);

  // ✅ SAVE OWNER INFO
  localStorage.setItem("ownerId", data.owner.id);
localStorage.setItem("ownerFullName", data.owner.fullName);
localStorage.setItem("accommodationName", data.owner.accommodationName);
localStorage.setItem("propertyType", data.owner.propertyType);

  setTimeout(() => {
    window.location.href = "/property-owner/dashboard";
  }, 1500);

}, 1500);

  } catch (err) {
    console.error(err);
    setIsLoading(false);
    setModalMessage("Server error. Please try again.");
    setShowModal(true);
  }
};

const handleGoToRegister = () => {
  setIsLoading(true);

  setTimeout(() => {
    setIsLoading(false);
    navigate("/property-owner/register");
  }, 2000);
};

  return (
    <div className="admin-register-wrapper">
      <div className="admin-register-card">
        <img src={trinigoLogo} alt="TriniGo Logo" className="admin-logo" />

        <h2 className="admin-register-title">Property Owner Login</h2>

        {/* EMAIL */}
        <div className="admin-form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="error-text">{errors.email}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="admin-form-group">
          <label>Password</label>

          <div className="admin-password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
  className="admin-eye-icon"
  onClick={() => setShowPassword(!showPassword)}
>
  {showPassword ? (
    /* OPEN EYE */
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    /* CLOSED EYE */
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.7 5.1A9.1 9.1 0 0 1 12 5c6 0 10.5 7 10.5 7a18.5 18.5 0 0 1-4.3 4.9M6.2 6.2C3.5 8.4 1.5 12 1.5 12a18.5 18.5 0 0 0 10.5 7.5c1.4 0 2.8-.3 4-.8"
      />
    </svg>
  )}
</span>
          </div>

          {errors.password && (
            <p className="error-text">{errors.password}</p>
          )}
        </div>

        {errors.general && (
          <p className="error-text" style={{ textAlign: "center" }}>
            {errors.general}
          </p>
        )}

        {/* LOGIN BUTTON */}
        <button
          className="admin-register-btn"
          onClick={handleLogin}
        >
          Log in
        </button>

        {/* REGISTER LINK */}
        <div className="admin-login-link">
          <span>Have you not registered yet?</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleGoToRegister();
            }}
          >
            Register
          </a>
        </div>
      </div>

      <LoadingModal show={isLoading} text="Loading..." />
      
      <MessageModal
  show={showModal}
  message={modalMessage}
  onClose={() => setShowModal(false)}
  showButton={false}
  autoClose={true}
  duration={1500}
/>
          </div>
  );
}