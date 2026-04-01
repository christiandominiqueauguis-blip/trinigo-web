import { useEffect, useState } from "react";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";
import { API_URL, BASE_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";
import "./AdminFeedback.css";
import MenuButton from "../../components/MenuButton";

function FeedbackCard({ review }) {
  const [expanded, setExpanded] = useState(false);

  const MAX_LENGTH = 100;
  const isLong = review.feedback.length > MAX_LENGTH;
  const displayText =
    !expanded && isLong
      ? review.feedback.slice(0, MAX_LENGTH) + "..."
      : review.feedback;

  return (
    <div className="feedback-card">
      <div className="feedback-user-row">
        {review.userProfileImage ? (
          <img
            src={`${BASE_URL}${review.userProfileImage}`}
            alt="User"
          />
        ) : (
          <div className="default-avatar" />
        )}
        <strong>{review.userName}</strong>
      </div>

      <div className="feedback-details">
        <p className="feedback-date">
          {new Date(review.createdAt).toLocaleDateString()}
        </p>

        <div className="stars">
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </div>

        <p
          className={`feedback-text ${isLong ? "clickable" : ""}`}
          onClick={() => isLong && setExpanded((prev) => !prev)}
        >
          {displayText}
        </p>
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const [reviewsData, setReviewsData] = useState([]);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const flattenedReviews = reviewsData.flatMap((spot) =>
    Array.isArray(spot.reviews)
      ? spot.reviews.map((review) => ({ ...review, spotName: spot.spotName }))
      : []
  );
  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(flattenedReviews, {
      initialPageSize: 6,
      resetKey: flattenedReviews.length,
    });

  useEffect(() => {
    fetch(`${API_URL}/tourist-spots`)
      .then((res) => res.json())
      .then(async (spots) => {
        const allReviews = await Promise.all(
          spots.map(async (spot) => {
            const res = await fetch(
              `${API_URL}/tourist-reviews/${spot._id}`
            );
            const reviewData = await res.json();

            return {
              spotName: spot.name,
              ...reviewData,
            };
          })
        );

        setReviewsData(allReviews);
      });
  }, []);

  return (
    <div className="property-owner-layout">
      <Sidebar
  active="feedback"
  isHidden={sidebarHidden}
  setIsHidden={setSidebarHidden}
/>

      <div className="po-content">
        {sidebarHidden && (
          <MenuButton
            className="menu-button--floating"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarHidden(false);
            }}
          />
        )}

        <div className="feedback-header">
  Tourist Spot Feedback
</div>

        <div className="feedback-cards-container">
          {paginatedItems.map((review) => (
            <FeedbackCard key={review._id} review={review} />
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
      </div>
    </div>
  );
}
