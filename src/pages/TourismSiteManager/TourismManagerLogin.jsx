import "./TourismManagerLogin.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";
import { clearRoleSession } from "../../features/auth/roleSession";

export default function TourismManagerLogin() {
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
    } else {
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "Password must contain at least 1 uppercase letter";
      } else if (!/\d/.test(password)) {
        newErrors.password = "Password must contain at least 1 number";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = "Password must contain at least 1 symbol";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/tourism-site-manager/login`, {
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

      // ✅ SUCCESS — save to localStorage
      const manager = data?.manager || {};
      const managerId = String(manager.id || manager._id || "");
      const managerName = manager.fullName || manager.username || "Tourism Site Manager";

      clearRoleSession("tourismManager");
      localStorage.setItem("tourismManagerFullName", managerName);
      localStorage.setItem("tourismManagerName", managerName);
      localStorage.setItem("tourismManagerUsername", manager.username || "");
      localStorage.setItem("tourismManagerId", managerId);
      localStorage.setItem("tourismManagerAuthToken", data.token || "");
      localStorage.setItem("tourismManagerProfile", JSON.stringify(manager));
      if (manager.profileImage) {
        localStorage.setItem("tourismManagerProfileImage", manager.profileImage);
      }
      if (manager.assignedTouristSpotId || manager.touristSpotId || manager.spotId) {
        localStorage.setItem(
          "tourismManagerAssignedSpotId",
          String(manager.assignedTouristSpotId || manager.touristSpotId || manager.spotId)
        );
      }
      if (manager.assignedTouristSpotName || manager.touristSpotName || manager.spotName) {
        localStorage.setItem(
          "tourismManagerAssignedSpotName",
          String(manager.assignedTouristSpotName || manager.touristSpotName || manager.spotName)
        );
      }

      setIsSuccess(true);
      setModalMessage("Login successful ✅");
      setShowModal(true);

      setTimeout(() => {
        setIsLoading(false);
        navigate("/tourism-site-manager/dashboard");
      }, 5000);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setIsSuccess(false);
      setModalMessage("Server error. Please try again.");
      setShowModal(true);
    }
  };

  return (
    <div className="tm-login-wrapper">
      <div className="tm-login-card">
        <img src={trinigoLogo} alt="TriniGo Logo" className="tm-login-logo" />

        <h2 className="tm-login-title">Log in</h2>

        {/* USERNAME */}
        <div className="tm-login-form-group">
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
        <div className="tm-login-form-group">
          <label>Password</label>

          <div className="tm-login-password-wrapper">
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
              className="tm-login-eye-icon"
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

        <button className="tm-login-btn" onClick={handleLogin}>
          Log in
        </button>

        <div className="tm-register-link">
          <span>Tourism Site Manager accounts are created by admin only.</span>
        </div>
      </div>

      <LoadingModal show={isLoading} text="Logging in..." />

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
