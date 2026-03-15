import "./Welcome.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LoadingModal from "../../components/LoadingModal";

export default function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="po-dashboard-wrapper">
      
      {/* REUSABLE SIDEBAR (DISABLED) */}
      <PropertyOwnerSidebar active="home" disabled />

      {/* MAIN CONTENT */}
      <main className="po-main-content">
        <div className="po-welcome-card">
          <h1>Welcome!</h1>

          <p>
            You haven't created any accommodation yet. Create your
            accommodation to publish it instantly on the TriniGo
            mobile app.
          </p>

          <button
  className="po-create-btn"
  onClick={() => {

    // ✅ CLEAR PREVIOUS FORM DATA FIRST
    localStorage.removeItem("createAccommodationData");

    setIsLoading(true);

    setTimeout(() => {
      navigate("/property-owner/create-accommodation");
    }, 2000);
  }}
>
  + Create Your Accommodation
</button>
        </div>
      </main>
      <LoadingModal show={isLoading} />
    </div>
  );
}