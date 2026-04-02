import { useEffect, useMemo, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import TourismManagerSidebar from "../../components/TourismManagerSidebar";
import { API_URL, BASE_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";
import "../PropertyOwner/Feedback.css";

function formatReviewDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StarRating({ rating, size = 16 }) {
  const filled = Math.round(Math.max(0, Math.min(5, Number(rating) || 0)));
  return (
    <span className="fb-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= filled ? "#116735" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const feedbackText = (review.feedback || "").trim();
  const isLong = feedbackText.length > 200;
  const displayText = !expanded && isLong ? `${feedbackText.slice(0, 200)}...` : feedbackText;

  return (
    <article className="fb-card">
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
            <p className="fb-accommodation">{review.spotName || "Tourist spot review"}</p>
            <time className="fb-date">{formatReviewDate(review.createdAt)}</time>
          </div>
        </div>

        <div className="fb-rating-badge" style={{ background: "#edf7f0", borderColor: "#b2d9bf", color: "#116735" }}>
          <strong>{Number(review.rating || 0).toFixed(1)}</strong>
          <StarRating rating={review.rating} size={13} />
          <span className="fb-rating-label">Rating</span>
        </div>
      </div>

      <div className="fb-feedback-box">
        <span className="fb-feedback-label">Visitor Feedback</span>
        {feedbackText ? (
          <p className="fb-feedback-text">
            {displayText}
            {isLong ? (
              <button type="button" className="fb-expand-btn" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "Show less" : "Read more"}
              </button>
            ) : null}
          </p>
        ) : (
          <p className="fb-feedback-empty">No written feedback was submitted with this rating.</p>
        )}
      </div>
    </article>
  );
}

export default function TourismManagerFeedback() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    fetch(`${API_URL}/tourist-spots`)
      .then((response) => response.json())
      .then(async (spots) => {
        const safeSpots = Array.isArray(spots) ? spots : [];
        const reviewCollections = await Promise.all(
          safeSpots.map(async (spot) => {
            try {
              const response = await fetch(`${API_URL}/tourist-reviews/${spot._id}`);
              const reviewData = await response.json();
              return Array.isArray(reviewData.reviews)
                ? reviewData.reviews.map((review) => ({
                    ...review,
                    spotName: spot.name,
                    spotId: spot._id,
                  }))
                : [];
            } catch {
              return [];
            }
          })
        );

        setReviews(reviewCollections.flat());
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load tourist spot feedback right now. Please refresh.");
        setReviews([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reviews;

    return reviews.filter((review) =>
      [review.userName, review.spotName, review.feedback]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [reviews, searchTerm]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(filteredReviews, {
      initialPageSize: 6,
      resetKey: `${filteredReviews.length}-${searchTerm}`,
    });

  return (
    <div className="property-owner-layout">
      <TourismManagerSidebar
        active="feedback"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main fb-main">
        <div className="fb-shell">
          <header className="fb-page-header">
            {sidebarHidden ? <MenuButton onClick={() => setSidebarHidden(false)} /> : null}
            <div className="fb-page-header-copy">
              <span className="fb-kicker">Visitor Reviews</span>
              <h1>Feedback</h1>
              <p>Review tourism spot ratings and written visitor comments.</p>
            </div>

            {!isLoading && reviews.length > 0 ? (
              <div className="fb-avg-chip">
                <strong>{averageRating}</strong>
                <StarRating rating={averageRating} size={15} />
                <span>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            ) : null}
          </header>

          <div className="fb-toolbar">
            <div className="fb-search-wrap">
              <svg className="fb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="fb-search-input"
                placeholder="Search by visitor, tourist spot, or feedback..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <span className="fb-result-count">
              {filteredReviews.length} result{filteredReviews.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div className="fb-empty">
              <strong>Loading feedback...</strong>
            </div>
          ) : error ? (
            <div className="fb-empty">
              <strong>Unable to load feedback</strong>
              <p>{error}</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="fb-empty">
              <strong>No feedback found</strong>
              <p>Visitor reviews will appear here once tourist spot feedback is submitted.</p>
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
