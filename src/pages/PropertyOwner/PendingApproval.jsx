import "./PendingApproval.css";
import { useLocation } from "react-router-dom";
import trinigoLogo from "../../assets/trinigo-logo.png";
import AccommodationApproved from "./AccommodationApproved";

export default function PendingApproval() {
  const location = useLocation();
  const { accommodationName, propertyType, businessAddress, registrationDate } =
    location.state || {};

  const approvedApps = JSON.parse(localStorage.getItem("approvedApps")) || [];

  const isApproved = approvedApps.some(
    app => app.accommodationName === accommodationName
  );

  if (isApproved) {
    return <AccommodationApproved />;
  }

  return (
    <div className="pending-wrapper">
      <div className="pending-card">
        <img src={trinigoLogo} className="pending-logo" alt="pending logo"/>

        <div className="icon">⏳</div>

        <h2>Accommodation Registration Pending Approval</h2>
        <span className="status">Pending Approval</span>

        <p className="description">
          Thank you for registering your property with us. Your submission is
          currently under review by our admin team or a tourism officer.
        </p>

        <div className="details">
          <div className="detail-row">
            <span>Registration Date:</span>
            <span>{registrationDate}</span>
          </div>

          <div className="detail-row">
            <span>Property Name:</span>
            <span>{accommodationName}</span>
          </div>

          <div className="detail-row">
            <span>Property Type:</span>
            <span>{propertyType}</span>
          </div>

          <div className="detail-row">
            <span>Property Location:</span>
            <span>{businessAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
}