import { useState, useEffect } from "react";
import MenuButton from "../../components/MenuButton";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import { API_URL } from "../../config/api";

export default function Dashboard() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [totalAccommodations, setTotalAccommodations] = useState(0);
  const [totalTouristSpots, setTotalTouristSpots] = useState(0);

  useEffect(() => {
    const approved = JSON.parse(localStorage.getItem("approvedApps")) || [];
    setTotalAccommodations(approved.length);

    fetch(`${API_URL}/tourist-spots`)
      .then((res) => res.json())
      .then((data) => {
        setTotalTouristSpots(data.length);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        active="dashboard"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      {isSidebarHidden && (
        <MenuButton onClick={() => setIsSidebarHidden(false)} />
      )}

      {/* MAIN CONTENT */}
      <main
        className="dashboard-main"
        onClick={() => {
          if (!isSidebarHidden) {
            setIsSidebarHidden(true);
          }
        }}
      >
        <div className="dashboard-header">
          Dashboard
        </div>

        {/* STATS */}
        <div className="dashboard-stats">
          <div className="dashboard-card">
            <p>Total Accommodations</p>
            <h3>{totalAccommodations}</h3>
          </div>

          <div className="dashboard-card">
            <p>Total Tourist Spots</p>
            <h3>{totalTouristSpots}</h3>
          </div>
        </div>
      </main>
    </div>
  );
}