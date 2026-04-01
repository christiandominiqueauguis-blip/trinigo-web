import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import { BASE_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";
import AccommodationStatusBadge from "./AccommodationStatusBadge";
import {
  AMENITIES_LIST,
  SORT_OPTIONS,
  TRINIDAD_DESTINATION,
  getAccommodationRoomNames,
  getAccommodationType,
  getOptionLabel,
  getStatusMeta,
} from "./accommodationHelpers";

function SummaryCard({ label, value, tone = "default" }) {
  return (
    <div className={`acm-summary-card acm-summary-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function formatCardImage(profileImage) {
  if (!profileImage) return "";
  if (String(profileImage).startsWith("data:")) return profileImage;
  if (String(profileImage).startsWith("http")) return profileImage;
  return `${BASE_URL}${profileImage}`;
}

export default function AccommodationOwnerListView({
  accommodations,
  filterStatus,
  hasDraft,
  isFetching,
  onAddNew,
  onDiscardDraft,
  onManageListing,
  onResumeDraft,
  search,
  setFilterStatus,
  setSearch,
  setSidebarHidden,
  setSortBy,
  sidebarHidden,
  sortBy,
  stats,
}) {
  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(accommodations, {
      initialPageSize: 6,
      resetKey: `${filterStatus}-${sortBy}-${search}`,
    });

  return (
    <>
      <div className="acm-page-header">
        <div className="acm-page-header-left">
          {sidebarHidden ? <MenuButton onClick={() => setSidebarHidden(false)} /> : null}
          <div className="acm-page-copy">
            <h2 className="acm-page-title">
              Manage only the listings uploaded under your account in{" "}
              {TRINIDAD_DESTINATION.fullLabel}.
            </h2>
            <p className="acm-page-sub">Only accommodations created by your property owner account are shown here.</p>
          </div>
        </div>

        <div className="acm-header-actions">
          {hasDraft ? (
            <button type="button" className="acm-secondary-btn" onClick={onResumeDraft}>
              Resume Draft
            </button>
          ) : null}
          <button type="button" className="acm-add-btn" onClick={onAddNew}>
            Add Accommodation
          </button>
        </div>
      </div>

      <section className="acm-overview-shell">

        {hasDraft ? (
          <div className="acm-draft-banner">
            <div>
              <strong>Saved draft ready</strong>
              <p>Your unfinished accommodation form is still available.</p>
            </div>
            <div className="acm-draft-actions">
              <button type="button" className="acm-secondary-btn" onClick={onResumeDraft}>
                Resume
              </button>
              <button type="button" className="acm-ghost-btn" onClick={onDiscardDraft}>
                Discard
              </button>
            </div>
          </div>
        ) : null}

        <div className="acm-summary-grid">
          <SummaryCard label="Total Listings" value={stats.totalListings} />
          <SummaryCard label="Open Listings" value={stats.totalOpen} tone="open" />
          <SummaryCard label="Closed Listings" value={stats.totalClosed} tone="closed" />
          <SummaryCard label="Room Types Uploaded" value={stats.totalRoomTypes} />
        </div>
      </section>

      <section className="acm-controls">
        <div className="acm-search-wrap">
          <input
            className="acm-search"
            type="text"
            placeholder="Search by listing name, type, or address"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <button type="button" className="acm-search-clear" onClick={() => setSearch("")}>
              Clear
            </button>
          ) : null}
        </div>

        <div className="acm-filter-row">
          <span className="acm-sort-label">Status</span>
          {["all", "open", "closed"].map((value) => (
            <button
              key={value}
              type="button"
              className={`acm-sort-pill ${filterStatus === value ? "acm-sort-pill--active" : ""}`}
              onClick={() => setFilterStatus(value)}
            >
              {value === "all" ? "All" : getStatusMeta(value).label}
            </button>
          ))}
        </div>

        <div className="acm-filter-row">
          <span className="acm-sort-label">Sort</span>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`acm-sort-pill ${sortBy === option.value ? "acm-sort-pill--active" : ""}`}
              onClick={() => setSortBy(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="acm-results-count">
          {totalItems} visible listing{totalItems === 1 ? "" : "s"}
        </span>
      </section>

      {isFetching ? (
        <div className="acm-empty">
          <p>Loading your listings...</p>
        </div>
      ) : accommodations.length === 0 ? (
        <div className="acm-empty">
          <p>
            {search || filterStatus !== "all"
              ? "No listings match the current filters."
              : "No accommodations uploaded yet."}
          </p>
          <button type="button" className="acm-empty-btn" onClick={onAddNew}>
            Create Your First Listing
          </button>
        </div>
      ) : (
        <>
          <div className="acm-grid">
            {paginatedItems.map((accommodation) => {
            const activityCount = Array.isArray(accommodation.activityPricing)
              ? accommodation.activityPricing.length
              : 0;
            const amenityPreview = Array.isArray(accommodation.amenityPricing)
              ? accommodation.amenityPricing
              : [];

            return (
              <article key={accommodation._id} className="acm-card">
                <div className="acm-card-img">
                  {accommodation.profileImage ? (
                    <img
                      src={formatCardImage(accommodation.profileImage)}
                      alt={accommodation.accommodationName}
                    />
                  ) : (
                    <div className="acm-card-fallback">No image</div>
                  )}

                  <div className="acm-card-status-overlay">
                    <AccommodationStatusBadge status={accommodation.status} />
                  </div>
                </div>

                <div className="acm-card-body">
                  <div className="acm-card-topline">
                    <span className="acm-card-type">{getAccommodationType(accommodation)}</span>
                    <span className="acm-card-caption">{getStatusMeta(accommodation.status).caption}</span>
                  </div>

                  <h3 className="acm-card-name">{accommodation.accommodationName}</h3>
                  <p className="acm-card-addr">{accommodation.businessAddress}</p>

                  <div className="acm-card-meta">
                    <span>{getAccommodationRoomNames(accommodation).length} room type(s)</span>
                    <span>{activityCount} activity option(s)</span>
                  </div>

                  {amenityPreview.length ? (
                    <div className="acm-card-tags">
                      {amenityPreview.slice(0, 3).map((item) => (
                        <span key={item.key} className="acm-tag">
                          {getOptionLabel(AMENITIES_LIST, item.key)}
                        </span>
                      ))}
                      {amenityPreview.length > 3 ? (
                        <span className="acm-tag acm-tag--muted">
                          +{amenityPreview.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {accommodation.status === "closed" && accommodation.closedDescription ? (
                    <p className="acm-closure-note">{accommodation.closedDescription}</p>
                  ) : null}

                  <button
                    type="button"
                    className="acm-view-btn"
                    onClick={() => onManageListing(accommodation._id)}
                  >
                    Manage Listing
                  </button>
                </div>
              </article>
            );
          })}
          </div>

          <Pagination
            currentPage={currentPage}
            itemLabel="listings"
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />
        </>
      )}
    </>
  );
}
