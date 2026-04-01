import trinigoLogo from "../../assets/trinigo-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    let newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
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
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsLoading(false);

        if (data.errors) {
          setErrors(data.errors);
        } else if (data.message) {
          setIsSuccess(false);
          setModalMessage(data.message);
          setShowModal(true);
        }
        return;
      }

      localStorage.setItem("adminId", data.admin.id);
      localStorage.setItem("fullName", data.admin.fullName);
      localStorage.setItem("adminAuthToken", data.token || "");

      setTimeout(() => {
        setIsLoading(false);
        navigate("/admin/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setModalMessage("Server error. Please try again.");
      setShowModal(true);
    }
  };

  return (
    <div className="admin-register-wrapper">
      <div className="admin-register-card">
        <img src={trinigoLogo} alt="TriniGo Logo" className="admin-logo" />

        <h2 className="admin-register-title">Log in</h2>

        {/* USERNAME */}
        <div className="admin-form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: "" }));
            }}
          />
          {errors.username && (
            <p className="error-text">{errors.username}</p>
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
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
            />

            <span
              className="admin-eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
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
        <button className="admin-register-btn" onClick={handleLogin}>
          Log in
        </button>

      </div>

      <LoadingModal show={isLoading} text="Loading..." />

      <MessageModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        showButton={!isSuccess}
        autoClose={isSuccess}
        duration={3000}
      />
    </div>
  );
}
