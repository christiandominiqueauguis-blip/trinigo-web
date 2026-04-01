import { useState, useEffect } from "react";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";
import MenuButton from "../../components/MenuButton";
import "./TouristSpots.css";
import { useNavigate } from "react-router-dom";
import { BASE_URL, API_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";

export default function TouristSpots() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [touristSpots, setTouristSpots] = useState([]);
  const navigate = useNavigate();
  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(touristSpots, {
      initialPageSize: 6,
      resetKey: touristSpots.length,
    });

  useEffect(() => {
  fetch(`${API_URL}/tourist-spots`)
    .then((res) => res.json())
    .then((data) => {
      setTouristSpots(data);
    })
    .catch((err) => console.error(err));
}, []);

  return (
    <div className="tourist-wrapper">
      <Sidebar
        active="tourist-spots"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      {/* MAIN CONTENT */}
      <main className="tourist-main">
        {isSidebarHidden ? (
          <MenuButton
            className="menu-button--floating"
            onClick={() => setIsSidebarHidden(false)}
          />
        ) : null}

        {/* HEADER */}
        <div className="tourist-header">Tourist Spots</div>

        {/* BUTTON */}
        <button
  className="tourist-add-btn"
  onClick={() => navigate("/admin/add-tourist-spot")}
>
  Add Tourist Spots
</button>

{/* TOURIST SPOT CARDS */}
<div className="tourist-card-container">
  {paginatedItems.map((spot) => (
    <div key={spot._id} className="tourist-card">
      
      <div className="tourist-image">
        <img
          src={`${BASE_URL}${spot.profileImage}`}
          alt={spot.name}
        />
      </div>

      <div className="tourist-info">
        <h3>{spot.name}</h3>
        <p>{spot.address}, Trinidad, Bohol</p>

        <button
  className="status-badge"
  onClick={() => navigate(`/admin/tourist-spots/${spot._id}`)}
>
  View
</button>
      </div>
    </div>
  ))}
</div>

<Pagination
  currentPage={currentPage}
  itemLabel="tourist spots"
  onPageChange={setCurrentPage}
  onPageSizeChange={setPageSize}
  pageSize={pageSize}
  totalItems={totalItems}
  totalPages={totalPages}
/>
      </main>
    </div>
  );
}
