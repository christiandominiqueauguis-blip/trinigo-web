import { useEffect, useState } from "react";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import "./BookingRequests.css";
import MenuButton from "../../components/MenuButton";

export default function BookingRequests() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");

  useEffect(() => {
    fetch("http://localhost:4000/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "Pending") return booking.status === "Pending";
    if (activeTab === "Approved") return booking.status === "Approved";
    if (activeTab === "Completed") return booking.status === "Completed";
    return true;
  });

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="booking-requests"
        isHidden={sidebarHidden}
      />

      <main
        className="property-owner-main"
        onClick={() => setSidebarHidden(true)}
      >

        {/* GREEN HEADER */}
        <div className="po-accommodation-header">
          Bookings

          {sidebarHidden && (
            <MenuButton
              onClick={(e) => {
                e.stopPropagation();
                setSidebarHidden(false);
              }}
            />
          )}
        </div>

        {/* BOOKING TABS */}
        <div className="booking-tabs">

          <button
            className={activeTab === "Pending" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("Pending")}
          >
            Booking Requests
          </button>

          <button
            className={activeTab === "Approved" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("Approved")}
          >
            Approved Bookings
          </button>

          <button
            className={activeTab === "Completed" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("Completed")}
          >
            Completed Bookings
          </button>

        </div>

        {filteredBookings.length === 0 && (
          <p className="empty-text">
            No {activeTab.toLowerCase()} bookings yet.
          </p>
        )}

        {/* BOOKING CARDS GRID */}
        <div className="booking-cards">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="booking-card">

              <div className="booking-top">
                <div className="booking-avatar">
                  {booking.userProfileImage ? (
                    <img
                      src={`http://localhost:4000${booking.userProfileImage}`}
                      alt="User"
                      className="booking-avatar-img"
                    />
                  ) : (
                    "👤"
                  )}
                </div>

                <div>
                  <p className="booking-name">
                    {booking.userFullName}
                  </p>
                  <small>
                    {new Date(booking.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>

              <div className="booking-buttons">
                <button
                  className="view-btn"
                  onClick={() => setSelectedBooking(booking)}
                >
                  View Details
                </button>

                {booking.status === "Pending" && (
                  <button
                    className="approve-btn"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `http://localhost:4000/api/bookings/${booking._id}/approve`,
                          { method: "PATCH" }
                        );

                        const result = await res.json();

                        if (res.ok) {
                          alert("Booking Approved ✅");

                          setBookings((prev) =>
                            prev.map((b) =>
                              b._id === booking._id
                                ? { ...b, status: "Approved" }
                                : b
                            )
                          );

                          setActiveTab("Approved");
                        } else {
                          alert(result.message);
                        }
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                  >
                    Approve
                  </button>
                )}

                {booking.status === "Approved" && (
                  <button
                    className="approve-btn"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `http://localhost:4000/api/bookings/${booking._id}/complete`,
                          { method: "PATCH" }
                        );

                        const result = await res.json();

                        if (res.ok) {
                          alert("Booking Completed ✅");

                          setBookings((prev) =>
                            prev.map((b) =>
                              b._id === booking._id
                                ? { ...b, status: "Completed" }
                                : b
                            )
                          );

                          setActiveTab("Completed");
                        } else {
                          alert(result.message);
                        }
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                  >
                    Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* VIEW DETAILS MODAL */}
        {selectedBooking && (
          <div className="modal-overlay">
            <div className="modal-content">

              <h3>Booking Details</h3>

              <p><strong>Full Name:</strong> {selectedBooking.userFullName}</p>
              <p><strong>Contact:</strong> {selectedBooking.contactNumber}</p>
              <p><strong>Room Type:</strong> {selectedBooking.roomType}</p>
              <p><strong>Room Price:</strong> ₱ {selectedBooking.roomPrice}</p>
              <p><strong>Max Persons:</strong> {selectedBooking.maxPersons}</p>
              <p><strong>Check-in:</strong> {new Date(selectedBooking.checkInDate).toDateString()}</p>
              <p><strong>Check-out:</strong> {new Date(selectedBooking.checkOutDate).toDateString()}</p>
              <p><strong>GCash Ref:</strong> {selectedBooking.referenceNumber}</p>

              <p><strong>Proof of Payment:</strong> {selectedBooking.proofImage && (
                <img
                  src={`http://localhost:4000${selectedBooking.proofImage}`}
                  alt="Proof"
                  className="proof-img"
                />
              )}</p>

              <button
                className="close-btn"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}