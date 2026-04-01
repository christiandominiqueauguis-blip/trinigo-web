import { useEffect, useMemo, useState } from "react";
import Pagination from "../../components/Pagination";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { API_URL, BASE_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";
import "./Feedback.css";
import MenuButton from "../../components/MenuButton";
import {
  matchesOwner,
  normalizeAccommodationRecord,
} from "../../features/accommodations/accommodationHelpers";
import { buildAuthHeaders } from "../../features/auth/roleSession";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReviewDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const FEELING_META = {
  satisfied:   { emoji: "😊", label: "Satisfied",   color: "#116735", bg: "#edf7f0" },
  happy:       { emoji: "😄", label: "Happy",        color: "#0d6e3b", bg: "#d6f5e3" },
  unsatisfied: { emoji: "😞", label: "Unsatisfied",  color: "#b45309", bg: "#fef3c7" },
  sad:         { emoji: "😢", label: "Sad",          color: "#b45309", bg: "#fef3c7" },
  angry:       { emoji: "😠", label: "Angry",        color: "#c53030", bg: "#fff0f0" },
};

function getFeelingMeta(feeling) {
  return FEELING_META[String(feeling || "").toLowerCase()] || null;
}

function getRatingMeta(rating) {
  const r = Number(rating) || 0;
  if (r >= 4.5) return { color: "#116735", bg: "#edf7f0", border: "#b2d9bf", label: "Excellent" };
  if (r >= 3.5) return { color: "#2e7d32", bg: "#f1faf3", border: "#c2e0c8", label: "Good" };
  if (r >= 2.5) return { color: "#9a6700", bg: "#fef9ec", border: "#f0d47a", label: "Average" };
  if (r >= 1.5) return { color: "#b45309", bg: "#fff7ed", border: "#fed7aa", label: "Poor" };
  return         { color: "#c53030", bg: "#fff0f0", border: "#fca5a5", label: "Bad" };
}

function StarRating({ rating, size = 16 }) {
  const filled = Math.round(Math.max(0, Math.min(5, Number(rating) || 0)));
  const { color } = getRatingMeta(rating);
  return (
    <span className="fb-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= filled ? color : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const feedbackText = (review.feedback || "").trim();
  const isLong = feedbackText.length > 200;
  const displayText = !expanded && isLong ? `${feedbackText.slice(0, 200)}…` : feedbackText;

  const ratingMeta  = getRatingMeta(review.rating);
  const feelingMeta = getFeelingMeta(review.feeling);

  return (
    <article className="fb-card">
      {/* Top row: avatar + identity + rating block */}
      <div className="fb-card-top">
        <div className="fb-guest">
          <div className="fb-avatar">
            {review.userProfileImage ? (
              <img
                src={`${BASE_URL}${review.userProfileImage}`}
                alt={review.userName}
                className="fb-avatar-img"
              />
            ) : (
              <span>{(review.userName || "A").charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="fb-guest-info">
            <h3 className="fb-guest-name">{review.userName || "Anonymous Guest"}</h3>
            <p className="fb-accommodation">{review.accommodationName || "Accommodation review"}</p>
            <time className="fb-date">{formatReviewDate(review.createdAt)}</time>
          </div>
        </div>

        {/* Rating badge */}
        <div
          className="fb-rating-badge"
          style={{ background: ratingMeta.bg, borderColor: ratingMeta.border, color: ratingMeta.color }}
        >
          <strong>{Number(review.rating || 0).toFixed(1)}</strong>
          <StarRating rating={review.rating} size={13} />
          <span className="fb-rating-label">{ratingMeta.label}</span>
        </div>
      </div>

      {/* Feeling + Rating tag row */}
      <div className="fb-tag-row">
        {feelingMeta && (
          <span
            className="fb-feeling-tag"
            style={{ background: feelingMeta.bg, color: feelingMeta.color }}
          >
            {feelingMeta.emoji} {feelingMeta.label}
          </span>
        )}
        <span className="fb-id-tag">
          #{String(review._id || "").slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Feedback text */}
      <div className="fb-feedback-box">
        <span className="fb-feedback-label">Guest Feedback</span>
        {feedbackText ? (
          <p className="fb-feedback-text">
            {displayText}
            {isLong && (
              <button
                type="button"
                className="fb-expand-btn"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        ) : (
          <p className="fb-feedback-empty">No written feedback was submitted with this rating.</p>
        )}
      </div>
    </article>
  );
}

// ─── Rating Distribution Bar ──────────────────────────────────────────────────

function RatingDistribution({ reviews }) {
  const counts = useMemo(() => {
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const key = Math.round(Number(r.rating) || 0);
      if (key >= 1 && key <= 5) map[key]++;
    });
    return map;
  }, [reviews]);

  const total = reviews.length || 1;

  return (
    <div className="fb-dist">
      {[5, 4, 3, 2, 1].map((star) => {
        const pct = Math.round((counts[star] / total) * 100);
        const meta = getRatingMeta(star);
        return (
          <div key={star} className="fb-dist-row">
            <span className="fb-dist-star">{star}★</span>
            <div className="fb-dist-track">
              <div
                className="fb-dist-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
            <span className="fb-dist-count">{counts[star]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest first" },
  { value: "oldest",  label: "Oldest first" },
  { value: "highest", label: "Highest rating" },
  { value: "lowest",  label: "Lowest rating" },
];

const RATING_FILTERS = [
  { value: "All", label: "All ratings" },
  { value: "5",   label: "5 stars" },
  { value: "4",   label: "4 stars & up" },
  { value: "3",   label: "3 stars & up" },
  { value: "2",   label: "2 stars & up" },
  { value: "1",   label: "1 star & up" },
];

export default function Feedback() {
  const ownerId = localStorage.getItem("ownerId") || "";

  const [reviews, setReviews]           = useState([]);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState("");
  const [searchTerm, setSearchTerm]       = useState("");
  const [ratingFilter, setRatingFilter]   = useState("All");
  const [sortBy, setSortBy]               = useState("newest");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ownerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    const authHeaders = buildAuthHeaders("propertyOwner");

    fetch(`${API_URL}/accommodations?ownerId=${encodeURIComponent(ownerId)}`, {
      headers: authHeaders,
    })
      .then((res) => res.json())
      .then(async (data) => {
        const ownerAccommodations = Array.isArray(data)
          ? data.filter((item) => matchesOwner(item, ownerId)).map(normalizeAccommodationRecord)
          : [];

        const reviewGroups = await Promise.all(
          ownerAccommodations.map(async (accommodation) => {
            try {
              const res  = await fetch(`${API_URL}/accommodation-reviews/${accommodation._id}`);
              const body = await res.json();
              return Array.isArray(body.reviews)
                ? body.reviews.map((review) => ({
                    ...review,
                    accommodationName: accommodation.accommodationName,
                    accommodationId:   accommodation._id,
                  }))
                : [];
            } catch {
              return [];
            }
          })
        );

        setReviews(reviewGroups.flat());
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load reviews right now. Please refresh.");
        setReviews([]);
      })
      .finally(() => setIsLoading(false));
  }, [ownerId]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const count      = reviews.length;
    const avgRating  = count
      ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count).toFixed(1)
      : "0.0";
    const withText   = reviews.filter((r) => (r.feedback || "").trim()).length;
    const listings   = new Set(reviews.map((r) => r.accommodationId)).size;
    return { count, avgRating, withText, listings };
  }, [reviews]);

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let result = reviews.filter((r) => {
      const matchSearch =
        !term ||
        [r.userName, r.accommodationName, r.feedback]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));

      const matchRating =
        ratingFilter === "All" || Number(r.rating || 0) >= Number(ratingFilter);

      return matchSearch && matchRating;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "highest") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === "lowest")  return (Number(a.rating) || 0) - (Number(b.rating) || 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

    return result;
  }, [reviews, searchTerm, ratingFilter, sortBy]);

  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(filteredAndSorted, {
      initialPageSize: 6,
      resetKey: `${filteredAndSorted.length}-${ratingFilter}-${sortBy}-${searchTerm}`,
    });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="feedback"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main fb-main">
        <div className="fb-shell">

          {/* Page Header */}
          <header className="fb-page-header">
            {sidebarHidden && (
              <MenuButton onClick={(e) => { e.stopPropagation(); setSidebarHidden(false); }} />
            )}
            <div className="fb-page-header-copy">
              <span className="fb-kicker">Guest Reviews</span>
              <h1>Feedback</h1>
              <p>See what guests are saying about your accommodations.</p>
            </div>

            {!isLoading && summary.count > 0 && (
              <div className="fb-avg-chip">
                <strong>{summary.avgRating}</strong>
                <StarRating rating={summary.avgRating} size={15} />
                <span>{summary.count} review{summary.count !== 1 ? "s" : ""}</span>
              </div>
            )}
          </header>

          {/* Summary Cards */}
          {!isLoading && (
            <div className="fb-summary-row">
              <div className="fb-summary-cards">
                <div className="fb-stat-card">
                  <span>Total Reviews</span>
                  <strong>{summary.count}</strong>
                </div>
                <div className="fb-stat-card fb-stat-card--rating">
                  <span>Average Rating</span>
                  <strong>{summary.avgRating}</strong>
                  <StarRating rating={summary.avgRating} size={14} />
                </div>
                <div className="fb-stat-card fb-stat-card--listings">
                  <span>Reviewed Listings</span>
                  <strong>{summary.listings}</strong>
                </div>
                <div className="fb-stat-card fb-stat-card--comments">
                  <span>With Comments</span>
                  <strong>{summary.withText}</strong>
                </div>
              </div>

              {/* Rating distribution */}
              {summary.count > 0 && (
                <div className="fb-dist-card">
                  <span className="fb-dist-title">Rating Breakdown</span>
                  <RatingDistribution reviews={reviews} />
                </div>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="fb-toolbar">
            <div className="fb-search-wrap">
              <svg className="fb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                className="fb-search-input"
                placeholder="Search by guest name, listing, or feedback…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="fb-search-clear" onClick={() => setSearchTerm("")}>×</button>
              )}
            </div>

            <div className="fb-toolbar-selects">
              <div className="fb-select-wrap">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="fb-select"
                >
                  {RATING_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <svg className="fb-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              <div className="fb-select-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="fb-select"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <svg className="fb-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <span className="fb-result-count">
              {filteredAndSorted.length} result{filteredAndSorted.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="fb-skeletons">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="fb-skeleton-card">
                  <div className="fb-skeleton fb-skeleton--top" />
                  <div className="fb-skeleton fb-skeleton--line" />
                  <div className="fb-skeleton fb-skeleton--block" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="fb-empty">
              <div className="fb-empty-icon fb-empty-icon--error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <strong>Unable to load reviews</strong>
              <p>{error}</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="fb-empty">
              <div className="fb-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <strong>{reviews.length === 0 ? "No reviews yet" : "No reviews matched"}</strong>
              <p>
                {reviews.length === 0
                  ? "Once guests submit ratings for your listings, they will appear here."
                  : "Try adjusting your search or filter settings."}
              </p>
            </div>
          ) : (
            <>
              <div className="fb-grid">
                {paginatedItems.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                itemLabel="reviews"
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
