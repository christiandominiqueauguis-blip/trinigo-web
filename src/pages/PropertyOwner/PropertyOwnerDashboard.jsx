import "./PropertyOwnerDashboard.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useState, useEffect } from "react";
import MenuButton from "../../components/MenuButton";
import { API_URL } from "../../config/api";

export default function PropertyOwnerDashboard() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  // NEW: total room types state
  const [totalRoomTypes, setTotalRoomTypes] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/bookings`)
      .then((res) => res.json())
      .then((data) => {
        const approvedCount = data.filter(
          (booking) => booking.status === "Approved"
        ).length;
        setActiveBookingsCount(approvedCount);

        const pendingCount = data.filter(
          (booking) => booking.status === "Pending"
        ).length;
        setPendingBookingsCount(pendingCount);
      })
      .catch((err) => console.error(err));

    // NEW: fetch accommodations and count total room types
    fetch(`${API_URL}/accommodations`)
      .then((res) => res.json())
      .then((data) => {
        const count = data.reduce(
          (total, accom) => total + (accom.rooms ? accom.rooms.length : 0),
          0
        );
        setTotalRoomTypes(count);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="property-owner-layout">
      
      {/* SIDEBAR */}
      <PropertyOwnerSidebar
        active="dashboard"
        isHidden={sidebarHidden}
      />

      {/* MAIN CONTENT */}
      <main
        className="property-owner-main"
        onClick={() => setSidebarHidden(true)}
      >

        {/* HEADER ROW */}
        <div className="po-header-row">

          {/* GREEN HEADER CARD */}
          <div className="po-dashboard-header">
            <h2>Dashboard</h2>

            {sidebarHidden && (
              <MenuButton
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarHidden(false);
                }}
              />
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="po-dashboard-actions">
            <button className="po-blue-btn">
              + Create Another Account
            </button>
          </div>

        </div>

        {/* OVERVIEW STATISTICS */}
        <h2 className="po-section-title">Overview Statistics</h2>

        <div className="po-stats-grid">
          <div className="po-stat-card">
            <p>Total Active Bookings</p>
            <h3>{activeBookingsCount}</h3>
          </div>

          <div className="po-stat-card">
            <p>Total Room Types</p>
            <h3>{totalRoomTypes}</h3>
          </div>

          <div className="po-stat-card">
            <p>Upcoming Check-ins</p>
            <h3>{pendingBookingsCount}</h3>
          </div>
        </div>
      </main>
    </div>
  );
}