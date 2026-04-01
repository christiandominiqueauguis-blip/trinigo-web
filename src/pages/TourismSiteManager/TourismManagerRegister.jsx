import "./TourismManagerRegister.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";

export default function TourismManagerRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleGoToLogin = () => {
    setModalMessage("Redirecting to login...");
    setShowModal(true);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      navigate("/tourism-site-manager/login");
    }, 1500);
  };

  const handleRequestSetup = () => {
    setModalMessage(
      "Tourism Site Manager accounts are created by an admin only. Please contact the TriniGo administrator for account setup."
    );
    setShowModal(true);
  };

  return (
    <div className="tm-register-wrapper">
      <div className="tm-register-card">
        <img src={trinigoLogo} alt="TriniGo Logo" className="tm-logo" />

        <h2 className="tm-register-title">Admin-Created Accounts Only</h2>

        <p style={{ margin: "0 0 18px", color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
          Tourism Site Manager accounts are no longer self-registered. Ask an administrator to create
          your account from the Admin User Management panel, then return here to log in.
        </p>

        <button className="tm-register-btn" onClick={handleRequestSetup}>
          Request Admin Setup
        </button>

        <div className="tm-login-link">
          <span>Already have an account?</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleGoToLogin();
            }}
          >
            Log in
          </a>
        </div>
      </div>

      <LoadingModal show={isLoading} text="Redirecting..." />

      <MessageModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        showButton
        autoClose={false}
      />
    </div>
  );
}
