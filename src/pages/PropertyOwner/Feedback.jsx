import { useEffect, useState } from "react";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { API_URL, BASE_URL } from "../../config/api";
import "./Feedback.css";
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
    <div className="feedback-card" key={review._id}>
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

export default function Feedback() {
  const [accommodations, setAccommodations] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // ✅ Fetch all accommodations of this owner
  useEffect(() => {
    fetch(`${API_URL}/accommodations`)
      .then((res) => res.json())
      .then(async (data) => {
        setAccommodations(data);

        // ✅ Fetch reviews for each accommodation
        const allReviews = await Promise.all(
          data.map(async (acc) => {
            const res = await fetch(
              `${API_URL}/accommodation-reviews/${acc._id}`
            );
            const reviewData = await res.json();

            return {
              accommodationName: acc.accommodationName,
              ...reviewData,
            };
          })
        );

        setReviewsData(allReviews);
      });
  }, []);

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="feedback"
        isHidden={sidebarHidden}
      />

      <div
        className={`po-content ${sidebarHidden ? "full-width" : ""}`}
        onClick={() => setSidebarHidden(true)}
      >
        <div className="po-accommodation-header">
          {sidebarHidden && (
            <MenuButton
              onClick={(e) => {
                e.stopPropagation();
                setSidebarHidden(false);
              }}
            />
          )}

          {reviewsData.length > 0 && reviewsData[0].accommodationName}
        </div>

        <div className="feedback-cards-container">
          {reviewsData.map((acc, index) =>
            acc.reviews.map((review) => (
              <FeedbackCard key={review._id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}