import "./AccommodationApproved.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";

export default function AccommodationApproved() {
  const navigate = useNavigate();

  // 👉 kunin ang approved application (latest)
  const approvedApps = JSON.parse(localStorage.getItem("approvedApps")) || [];
  const approved = approvedApps[approvedApps.length - 1];
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const handleProceedLogin = () => {
  setIsLoading(true);

  // ⏳ keep loading muna
  setTimeout(() => {
    setIsLoading(false);

    // ✅ success message (NO OK)
    setModalMessage("Approval successful ✅. Redirecting to login...");
    setShowModal(true);

    // ➡️ auto redirect
    setTimeout(() => {
      navigate("/property-owner/login");
    }, 1500);

  }, 1500);
};

  if (!approved) return null;

  return (
    <div className="approved-wrapper">
      <div className="approved-card">

        <img src={trinigoLogo} className="approved-logo" />

        <h1 className="approved-title">
          Accommodation Approved! 🎉
        </h1>

        <p className="approved-text">
  Congratulations, your property{" "}
  <span className="approved-accommodation-name">
    {approved.accommodationName}
  </span>{" "}
  has been successfully registered and approved by the admin team. You're now
  ready to welcome guests!
</p>

        <div className="approved-details">
          <h4>Approval Details</h4>

          <div className="approved-row">
            <span>Approval Date:</span>
            <span>
              {new Date(approved.approvedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="approved-row">
  <span>Approved By:</span>
  <span>
    {localStorage.getItem("adminFullName")}
    <small>Tourism Officer</small>
  </span>
</div>

        </div>

        <button
  className="approved-btn"
  onClick={handleProceedLogin}
>
  Proceed to Login
</button>

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