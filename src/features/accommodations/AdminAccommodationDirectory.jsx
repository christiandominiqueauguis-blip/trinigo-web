import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";
import { BASE_URL, API_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";
import AccommodationStatusBadge from "./AccommodationStatusBadge";
import {
  getAccommodationRoomNames,
  getAccommodationType,
  normalizeAccommodationRecord,
} from "./accommodationHelpers";

function formatCardImage(profileImage) {
  if (!profileImage) return "";
  if (String(profileImage).startsWith("data:")) return profileImage;
  if (String(profileImage).startsWith("http")) return profileImage;
  return `${BASE_URL}${profileImage}`;
}

export default function AdminAccommodationDirectory() {
  const navigate = useNavigate();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [accommodations, setAccommodations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/accommodations`)
      .then((response) => response.json())
      .then((data) =>
        setAccommodations(Array.isArray(data) ? data.map(normalizeAccommodationRecord) : [])
      )
      .catch((error) => console.error(error));
  }, []);

  const filtered = accommodations.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    if (!matchesStatus) return false;

    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return true;

    const searchable = [item.accommodationName, item.businessAddress, getAccommodationType(item)]
      .join(" ")
      .toLowerCase();

    return searchable.includes(searchValue);
  });

  const stats = {
    total: accommodations.length,
    open: accommodations.filter((item) => item.status === "open").length,
    closed: accommodations.filter((item) => item.status === "closed").length,
  };
  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(filtered, {
      initialPageSize: 6,
      resetKey: `${statusFilter}-${search}`,
    });

  return (
    <div className="accommodation-wrapper">
      <Sidebar
        active="accommodations"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      <main className="accommodation-main">
        <div className="accommodation-shell">
          <div className="accommodation-hero">
            <div className="accommodation-hero-copy">
              <div className="accommodation-hero-topline">
                {isSidebarHidden ? <MenuButton onClick={() => setIsSidebarHidden(false)} /> : null}
                <span className="accommodation-kicker">Admin Directory</span>
              </div>
              <h1>Accommodation Listings</h1>
              <p>
                Review property-owner accommodation uploads, inspect their status, and open each
                listing for detailed management.
              </p>
            </div>
            <div className="accommodation-stats">
              <div>
                <span>Total</span>
                <strong>{stats.total}</strong>
              </div>
              <div>
                <span>Open</span>
                <strong>{stats.open}</strong>
              </div>
              <div>
                <span>Closed</span>
                <strong>{stats.closed}</strong>
              </div>
            </div>
          </div>

          <div className="accommodation-toolbar">
            <input
              className="accommodation-search"
              type="text"
              placeholder="Search listing, type, or address"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="accommodation-filter-group">
              {["all", "open", "closed"].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`accommodation-filter ${statusFilter === value ? "accommodation-filter--active" : ""}`}
                  onClick={() => setStatusFilter(value)}
                >
                  {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="accommodation-empty">
              <p>No accommodations match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="accommodation-grid">
                {paginatedItems.map((accommodation) => (
                  <article key={accommodation._id} className="accommodation-card">
                    <div className="accommodation-card-media">
                      {accommodation.profileImage ? (
                        <img
                          src={formatCardImage(accommodation.profileImage)}
                          alt={accommodation.accommodationName}
                        />
                      ) : (
                        <div className="accommodation-card-fallback">No image</div>
                      )}
                      <div className="accommodation-card-status">
                        <AccommodationStatusBadge status={accommodation.status} />
                      </div>
                    </div>

                    <div className="accommodation-card-content">
                      <span className="accommodation-card-type">{getAccommodationType(accommodation)}</span>
                      <h3>{accommodation.accommodationName}</h3>
                      <p>{accommodation.businessAddress}</p>
                      <div className="accommodation-card-meta">
                        <span>{getAccommodationRoomNames(accommodation).length} room type(s)</span>
                      </div>
                      <button
                        type="button"
                        className="accommodation-view-btn"
                        onClick={() => navigate(`/admin/accommodations/${accommodation._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                itemLabel="accommodations"
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
