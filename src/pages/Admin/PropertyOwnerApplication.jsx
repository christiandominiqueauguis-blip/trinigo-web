import { useState, useEffect } from "react";
import MenuButton from "../../components/MenuButton";
import "./PropertyOwnerApplication.css";
import Sidebar from "../../components/Sidebar";
import { BASE_URL, API_URL } from "../../config/api";

export default function PropertyOwnerApplication() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectedApplications, setRejectedApplications] = useState([]);


    useEffect(() => {
  const approved = JSON.parse(localStorage.getItem("approvedApps")) || [];
  const rejected = JSON.parse(localStorage.getItem("rejectedApps")) || [];

  setApprovedApplications(approved);
  setRejectedApplications(rejected);

  fetch(`${API_URL}/admin/property-owners`)
    .then(res => res.json())
    .then(data => {
      const filtered = data.filter(
        app =>
          !approved.some(a => a._id === app._id) &&
          !rejected.some(r => r._id === app._id)
      );

      setApplications(filtered);
    })
    .catch(err => {
      console.error("Failed to load applications", err);
    });
}, []);

  return (
    <div className="property-owner-layout">
      <Sidebar
  active="property"
  isHidden={isSidebarHidden}
  setIsHidden={setIsSidebarHidden}
/>

{isSidebarHidden && (
  <MenuButton onClick={() => setIsSidebarHidden(false)} />
)}
      
      {/* MAIN CONTENT */}
      <main
  className="property-owner-main"
  onClick={() => {
    if (!isSidebarHidden) {
      setIsSidebarHidden(true);
    }
  }}
>
        <div className="property-owner-wrapper">
          {/* HEADER */}
          <div className="property-owner-header">
            Property Owner Applications
          </div>

          {/* FILTER BAR */}
          

            <div className="property-owner-filter-buttons">
              <button
  className="property-owner-btn pending-btn"
  onClick={() => setActiveTab("pending")}
>
  Pending Review
</button>

<button
  className="property-owner-btn approved-btn"
  onClick={() => setActiveTab("approved")}
>
  Approved Accommodation
</button>
            </div>
          
{/* APPLICATION CARDS */}
<div className="property-owner-cards">

  {/* ===== PENDING APPLICATIONS ===== */}
  {activeTab === "pending" && (
    <>
      {applications.length === 0 && (
        <p>No property owner applications yet.</p>
      )}

      {applications.map(app => (
        <div className="property-owner-card" key={app._id}>

          <div className="card-header">
            <h4>{app.accommodationName}</h4>
            <span className="property-owner-status">
              Pending Review
            </span>
          </div>

          <div className="card-body">
            <p className="application-date">
              Application Date:{" "}
              {new Date(app.createdAt).toISOString().split("T")[0]}
            </p>
          </div>

          <div className="property-owner-actions">
            <button
              className="approve"
              onClick={() => {
                setApplications(prev =>
  prev.filter(item => item._id !== app._id)
);

<button
  className="approve"
  onClick={() => {
    setApplications(prev =>
      prev.filter(item => item._id !== app._id)
    );

    const approvedApp = {
      ...app,
      approvedAt: new Date().toISOString()
    };

    setApprovedApplications(prev => {
      const updated = [...prev, approvedApp];
      localStorage.setItem("approvedApps", JSON.stringify(updated));
      return updated;
    });

    if (selectedApp?._id === app._id) {
      setSelectedApp(null);
    }
  }}
>
  Approve
</button>

if (selectedApp?._id === app._id) {
  setSelectedApp(null);
}

                const approvedApp = {
  ...app,
  approvedAt: new Date().toISOString()
};

setApprovedApplications(prev => {
  const updated = [...prev, approvedApp];
  localStorage.setItem("approvedApps", JSON.stringify(updated));
  return updated;
});
              }}
            >
              Approve
            </button>

            <button
  className="reject"
  onClick={() => {
    setApplications(prev =>
      prev.filter(item => item._id !== app._id)
    );

    setRejectedApplications(prev => {
      const updated = [...prev, app];
      localStorage.setItem("rejectedApps", JSON.stringify(updated));
      return updated;
    });

    if (selectedApp?._id === app._id) {
      setSelectedApp(null);
    }
  }}
>
  Reject
</button>

            <button
              className="details"
              onClick={() => setSelectedApp(app)}
            >
              View Details
            </button>
          </div>

        </div>
      ))}
    </>
  )}

  {/* ===== APPROVED ACCOMMODATIONS ===== */}
  {activeTab === "approved" && (
    <>
      {approvedApplications.length === 0 && (
        <p>No approved accommodations yet.</p>
      )}

      {approvedApplications.map(app => (
        <div className="property-owner-card" key={app._id}>

          <div className="card-header">
            <h4>{app.accommodationName}</h4>
            <span
              className="property-owner-status"
              style={{ background: "#3b82f6" }}
            >
              Approved
            </span>
          </div>

          <div className="card-body">
            <p className="application-date">
              Date Approved:{" "}
              {new Date(app.approvedAt).toISOString().split("T")[0]}
            </p>
          </div>

          <div className="property-owner-actions approved-actions">
  <button
    className="delete"
    onClick={() => {
      setApprovedApplications(prev => {
        const updated = prev.filter(item => item._id !== app._id);
        localStorage.setItem("approvedApps", JSON.stringify(updated));
        return updated;
      });

      if (selectedApp?._id === app._id) {
        setSelectedApp(null);
      }
    }}
  >
    Delete
  </button>

  <button
    className="details"
    onClick={() => setSelectedApp(app)}
  >
    View Details
  </button>
</div>

        </div>
      ))}
    </>
  )}
</div>

{selectedApp && (
  <div className="details-modal">
    <div className="details-card">
      <h3>{selectedApp.accommodationName}</h3>

      <p><strong>Owner Name:</strong> {selectedApp.fullName}</p>
      <p><strong>Email:</strong> {selectedApp.email}</p>
      <p><strong>Phone:</strong> {selectedApp.phone}</p>
      <p><strong>Property Type:</strong> {selectedApp.propertyType}</p>
      <p><strong>Address:</strong> {selectedApp.businessAddress}</p>
      <p><strong>Description:</strong> {selectedApp.description}</p>

      <h4>Business Documents</h4>
      <div className="permit-list">
        {selectedApp.businessPermits.map((file, index) => (
          <a
            key={index}
            href={`${BASE_URL}${file}`}
            target="_blank"
            rel="noreferrer"
          >
            View Document {index + 1}
          </a>
        ))}
      </div>

      <button
        className="close"
        onClick={() => setSelectedApp(null)}
      >
        Close
      </button>
    </div>
  </div>
)}
        </div>
      </main>
    </div>
  );
}