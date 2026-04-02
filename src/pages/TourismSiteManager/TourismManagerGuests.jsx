import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import TourismManagerSidebar from "../../components/TourismManagerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import usePagination from "../../hooks/usePagination";
import "../PropertyOwner/BookingRequests.css";
import "./TourismManagerReports.css";
import "./TourismManagerGuests.css";

const STATUS_FILTERS = ["All", "Pending", "Completed", "Rejected", "Cancelled"];
const SOURCE_FILTERS = ["All", "Walk-in", "Online"];

function createGuestRow() {
  return {
    fullName: "",
    contactNumber: "",
    notes: "",
  };
}

function getStoredManagerProfile() {
  try {
    const raw = localStorage.getItem("tourismManagerProfile");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(dateValue, options) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-PH", options);
}

function formatDateTime(dateValue) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value) {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function isWalkInBooking(booking) {
  const paymentMethod = String(booking?.paymentMethod || "").toUpperCase();
  const source = String(booking?.bookingMetadata?.source || "").toUpperCase();

  return (
    paymentMethod === "WALK_IN" ||
    source === "OWNER_WALK_IN" ||
    source === "TOURISM_MANAGER_WALK_IN" ||
    source === "TOURIST_SPOT_WALK_IN"
  );
}

function getStatusMeta(status) {
  switch (status) {
    case "Completed":
      return {
        label: "Completed",
        badgeClass: "po-booking-status po-booking-status--completed",
      };
    case "Rejected":
      return {
        label: "Rejected",
        badgeClass: "po-booking-status po-booking-status--rejected",
      };
    case "Cancelled":
      return {
        label: "Cancelled",
        badgeClass: "po-booking-status po-booking-status--cancelled",
      };
    default:
      return {
        label: "Pending",
        badgeClass: "po-booking-status po-booking-status--pending",
      };
  }
}

function getAssignedSpotFromSources(touristSpots) {
  const managerProfile = getStoredManagerProfile();
  const storedSpotId = localStorage.getItem("tourismManagerAssignedSpotId") || "";
  const storedSpotName = localStorage.getItem("tourismManagerAssignedSpotName") || "";
  const managerId = localStorage.getItem("tourismManagerId") || "";
  const managerUsername = localStorage.getItem("tourismManagerUsername") || managerProfile.username || "";
  const managerName =
    localStorage.getItem("tourismManagerFullName") ||
    localStorage.getItem("tourismManagerName") ||
    managerProfile.fullName ||
    "";

  const directId =
    storedSpotId ||
    managerProfile.assignedTouristSpotId ||
    managerProfile.touristSpotId ||
    managerProfile.spotId ||
    "";
  const directName =
    storedSpotName ||
    managerProfile.assignedTouristSpotName ||
    managerProfile.touristSpotName ||
    managerProfile.spotName ||
    "";

  const findById = touristSpots.find(
    (spot) => normalizeValue(spot?._id) && normalizeValue(spot?._id) === normalizeValue(directId)
  );
  if (findById) return findById;

  const findByName = touristSpots.find(
    (spot) => normalizeValue(spot?.name) && normalizeValue(spot?.name) === normalizeValue(directName)
  );
  if (findByName) return findByName;

  return (
    touristSpots.find((spot) =>
      [spot?.managerId, spot?.assignedManagerId, spot?.tourismManagerId].some(
        (value) => normalizeValue(value) === normalizeValue(managerId)
      )
    ) ||
    touristSpots.find((spot) =>
      [spot?.managerUsername, spot?.assignedManagerUsername].some(
        (value) => normalizeValue(value) === normalizeValue(managerUsername)
      )
    ) ||
    touristSpots.find((spot) =>
      [spot?.managerName, spot?.assignedManagerName].some(
        (value) => normalizeValue(value) === normalizeValue(managerName)
      )
    ) ||
    null
  );
}

function bookingMatchesSpot(booking, assignedSpot) {
  if (!assignedSpot) return false;

  const spotIds = [
    assignedSpot._id,
    assignedSpot.id,
    assignedSpot.spotId,
    localStorage.getItem("tourismManagerAssignedSpotId"),
  ]
    .map(normalizeValue)
    .filter(Boolean);

  const spotNames = [
    assignedSpot.name,
    assignedSpot.spotName,
    assignedSpot.establishmentName,
    localStorage.getItem("tourismManagerAssignedSpotName"),
  ]
    .map(normalizeValue)
    .filter(Boolean);

  const bookingIds = [
    booking?.touristSpotId,
    booking?.spotId,
    booking?.establishmentId,
    booking?.bookingMetadata?.touristSpotId,
    booking?.bookingMetadata?.spotId,
  ]
    .map(normalizeValue)
    .filter(Boolean);

  const bookingNames = [
    booking?.touristSpotName,
    booking?.spotName,
    booking?.establishmentName,
    booking?.bookingMetadata?.touristSpotName,
    booking?.bookingMetadata?.spotName,
    booking?.bookingMetadata?.establishmentName,
  ]
    .map(normalizeValue)
    .filter(Boolean);

  return (
    bookingIds.some((value) => spotIds.includes(value)) ||
    bookingNames.some((value) => spotNames.includes(value))
  );
}

function buildGuestPayload(formState) {
  const headGuest = {
    fullName: String(formState.fullName || "").trim(),
    contactNumber: String(formState.contactNumber || "").trim(),
    isHeadGuest: true,
    notes: "",
  };

  return [headGuest].concat(
    (Array.isArray(formState.guestRows) ? formState.guestRows : [])
      .map((guest) => ({
        fullName: String(guest.fullName || "").trim(),
        contactNumber: String(guest.contactNumber || "").trim(),
        isHeadGuest: false,
        notes: String(guest.notes || "").trim(),
      }))
      .filter((guest) => guest.fullName)
  );
}

async function submitWalkInGuest({ authHeaders, payload }) {
  const endpoints = [
    `${API_URL}/tourism-site-manager/bookings/walk-in`,
    `${API_URL}/tourism-site-manager/walk-in-guests`,
    `${API_URL}/bookings/walk-in`,
    `${API_URL}/property-owner/bookings/walk-in`,
  ];

  let lastErrorMessage = "Unable to save the walk-in guest right now.";

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        return result;
      }

      lastErrorMessage = result.message || lastErrorMessage;

      if (![401, 403, 404, 405].includes(response.status)) {
        throw new Error(lastErrorMessage);
      }
    } catch (error) {
      lastErrorMessage = error.message || lastErrorMessage;
    }
  }

  throw new Error(lastErrorMessage);
}

export default function TourismManagerGuests({
  activeNav = "guests",
  kicker = "Guest Management",
  emptyMessage = "No guests matched this tourist spot view.",
  emptyDescription,
  actionLabel = "Add Walk-in Guest",
} = {}) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [assignedSpot, setAssignedSpot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formState, setFormState] = useState({
    fullName: "",
    contactNumber: "",
    visitDate: "",
    totalGuests: "1",
    amount: "",
    guestOrigin: "",
    notes: "",
    initialStatus: "Completed",
    markAsPaid: true,
    guestRows: [createGuestRow()],
  });

  const authHeaders = useMemo(() => buildAuthHeaders("tourismManager"), []);
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ visible: false, type: "", message: "" });

  const showToast = useCallback((message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, type, message });
    toastTimerRef.current = setTimeout(
      () => setToast({ visible: false, type: "", message: "" }),
      4000
    );
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  const loadGuestData = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const [spotsResponse, bookingsResponse] = await Promise.all([
        fetch(`${API_URL}/tourist-spots`, { headers: authHeaders }),
        fetch(`${API_URL}/bookings`, { headers: authHeaders }),
      ]);

      const [spotsData, bookingsData] = await Promise.all([
        spotsResponse.json(),
        bookingsResponse.json(),
      ]);

      if (!spotsResponse.ok || !bookingsResponse.ok) {
        throw new Error(
          spotsData.message ||
            bookingsData.message ||
            "Unable to load tourism guest data right now."
        );
      }

      const nextSpots = Array.isArray(spotsData) ? spotsData : [];
      const nextBookings = Array.isArray(bookingsData) ? bookingsData : [];

      setBookings(nextBookings);
      setAssignedSpot(getAssignedSpotFromSources(nextSpots));
    } catch (error) {
      console.error("Failed to load tourism manager guest data", error);
      setBookings([]);
      setAssignedSpot(null);
      setPageError(error.message || "Unable to load tourism guest data right now.");
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadGuestData();
  }, [loadGuestData]);

  const assignedSpotBookings = useMemo(
    () =>
      bookings
        .filter((booking) => bookingMatchesSpot(booking, assignedSpot))
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [assignedSpot, bookings]
  );

  const bookingStats = useMemo(
    () => ({
      total: assignedSpotBookings.length,
      walkIn: assignedSpotBookings.filter((booking) => isWalkInBooking(booking)).length,
      online: assignedSpotBookings.filter((booking) => !isWalkInBooking(booking)).length,
      completed: assignedSpotBookings.filter((booking) => booking.status === "Completed").length,
    }),
    [assignedSpotBookings]
  );

  const filteredBookings = useMemo(() => {
    const normalizedSearch = normalizeValue(searchTerm);

    return assignedSpotBookings.filter((booking) => {
      const bookingSource = isWalkInBooking(booking) ? "Walk-in" : "Online";
      const matchesStatus = statusFilter === "All" ? true : booking.status === statusFilter;
      const matchesSource = sourceFilter === "All" ? true : bookingSource === sourceFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          booking.userFullName,
          booking.fullName,
          booking.headGuestName,
          booking.contactNumber,
          booking.bookingId,
          booking.touristSpotName,
          booking.establishmentName,
        ]
          .filter(Boolean)
          .some((value) => normalizeValue(value).includes(normalizedSearch));

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [assignedSpotBookings, searchTerm, sourceFilter, statusFilter]);

  const {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    setPageSize,
    totalItems,
    totalPages,
  } = usePagination(filteredBookings, {
    initialPageSize: 6,
    resetKey: `${filteredBookings.length}-${searchTerm}-${statusFilter}-${sourceFilter}`,
  });

  const openWalkInModal = () => {
    setFormError("");
    setFormState({
      fullName: "",
      contactNumber: "",
      visitDate: new Date().toISOString().slice(0, 10),
      totalGuests: "1",
      amount: String(
        assignedSpot?.entranceFee?.age13up ||
          assignedSpot?.entranceFee?.adult ||
          assignedSpot?.entranceFee ||
          ""
      ),
      guestOrigin: "",
      notes: "",
      initialStatus: "Completed",
      markAsPaid: true,
      guestRows: [createGuestRow()],
    });
    setIsFormOpen(true);
  };

  const closeWalkInModal = () => {
    setIsFormOpen(false);
    setFormError("");
    setIsSubmittingForm(false);
  };

  const updateFormField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const updateGuestRow = (index, field, value) => {
    setFormState((current) => ({
      ...current,
      guestRows: current.guestRows.map((guest, guestIndex) =>
        guestIndex === index ? { ...guest, [field]: value } : guest
      ),
    }));
  };

  const addGuestRow = () => {
    setFormState((current) => ({
      ...current,
      guestRows: [...current.guestRows, createGuestRow()],
    }));
  };

  const removeGuestRow = (index) => {
    setFormState((current) => ({
      ...current,
      guestRows:
        current.guestRows.length === 1
          ? [createGuestRow()]
          : current.guestRows.filter((_, guestIndex) => guestIndex !== index),
    }));
  };

  const handleSubmitWalkIn = async () => {
    setFormError("");

    if (!assignedSpot) {
      setFormError("This account does not have an assigned tourist spot yet.");
      return;
    }

    if (!String(formState.fullName || "").trim()) {
      setFormError("Guest full name is required.");
      return;
    }

    if (!/^[0-9]{11}$/.test(String(formState.contactNumber || "").trim())) {
      setFormError("Contact number must be 11 digits.");
      return;
    }

    if (!formState.visitDate) {
      setFormError("Visit date is required.");
      return;
    }

    setIsSubmittingForm(true);

    try {
      const payload = {
        touristSpotId: assignedSpot._id,
        touristSpotName: assignedSpot.name,
        spotId: assignedSpot._id,
        spotName: assignedSpot.name,
        establishmentName: assignedSpot.name,
        fullName: formState.fullName,
        contactNumber: formState.contactNumber,
        maxPersons: Number(formState.totalGuests || 1),
        totalGuests: Number(formState.totalGuests || 1),
        checkInDate: formState.visitDate,
        checkOutDate: formState.visitDate,
        visitDate: formState.visitDate,
        roomType: "Walk-in Guest",
        roomPrice: Number(formState.amount || 0),
        totalAmount: Number(formState.amount || 0),
        entranceFee: Number(formState.amount || 0),
        initialStatus: formState.initialStatus,
        paymentMethod: "WALK_IN",
        paymentStatus: formState.markAsPaid ? "PAID" : "UNPAID",
        markAsPaid: formState.markAsPaid,
        guestOrigin: formState.guestOrigin,
        notes: formState.notes,
        guestDetails: buildGuestPayload(formState),
        bookingMetadata: {
          source: "TOURISM_MANAGER_WALK_IN",
          guestOrigin: formState.guestOrigin,
          notes: formState.notes,
          touristSpotId: assignedSpot._id,
          touristSpotName: assignedSpot.name,
        },
      };

      await submitWalkInGuest({ authHeaders, payload });
      await loadGuestData();
      closeWalkInModal();
      showToast("Walk-in guest added successfully.");
    } catch (error) {
      console.error("Failed to save tourism manager walk-in guest", error);
      setFormError(error.message || "Unable to save the walk-in guest right now.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="property-owner-layout">
      <TourismManagerSidebar
        active={activeNav}
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className={`tm-dashboard-main ${sidebarHidden ? "full-width" : ""}`}>
        <section className="tm-compact-toolbar">
          <div className="tm-compact-toolbar-left">
            {sidebarHidden ? (
              <MenuButton
                onClick={(event) => {
                  event.stopPropagation();
                  setSidebarHidden(false);
                }}
              />
            ) : null}
            <span className="tm-compact-kicker">{kicker}</span>
          </div>

          <div className="tm-guests-spot-card tm-guests-spot-card--compact">
            <span>Assigned Tourist Spot</span>
            <strong>{assignedSpot?.name || "No tourist spot assigned yet"}</strong>
            <small>
              {assignedSpot?.address ||
                "Ask admin to link this tourism site manager to a tourist spot to unlock booking visibility."}
            </small>
          </div>
        </section>

        {isLoading ? (
          <section className="tm-dashboard-empty">
            <p>Loading guest management...</p>
          </section>
        ) : pageError ? (
          <section className="tm-dashboard-empty tm-dashboard-empty--error">
            <p>{pageError}</p>
            <button type="button" className="tm-secondary-btn" onClick={loadGuestData}>
              Try Again
            </button>
          </section>
        ) : !assignedSpot ? (
          <section className="tm-dashboard-empty">
            <p>No tourist spot assignment was found for this tourism site manager account.</p>
          </section>
        ) : (
          <>
            <section className="tm-dashboard-card-grid">
              <article className="tm-dashboard-card">
                <span>Total Guests</span>
                <strong>{bookingStats.total}</strong>
                <small>All booking records matched to your assigned tourist spot.</small>
              </article>
              <article className="tm-dashboard-card">
                <span>Walk-in Guests</span>
                <strong>{bookingStats.walkIn}</strong>
                <small>Manual or walk-in guest entries already tracked in the system.</small>
              </article>
              <article className="tm-dashboard-card">
                <span>Online Guests</span>
                <strong>{bookingStats.online}</strong>
                <small>Bookings created outside the walk-in workflow.</small>
              </article>
              <article className="tm-dashboard-card">
                <span>Completed Visits</span>
                <strong>{bookingStats.completed}</strong>
                <small>Guest records already marked completed.</small>
              </article>
            </section>

            <section className="tm-guests-toolbar">
              <div className="tm-guests-filter-grid">
                <label className="po-bookings-filter-field">
                  <span>Search Guests</span>
                  <input
                    type="search"
                    placeholder="Search by guest, booking ID, contact, or tourist spot"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <label className="po-bookings-filter-field">
                  <span>Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="po-bookings-filter-field">
                  <span>Source</span>
                  <select
                    value={sourceFilter}
                    onChange={(event) => setSourceFilter(event.target.value)}
                  >
                    {SOURCE_FILTERS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="po-booking-action po-booking-action--primary"
                onClick={openWalkInModal}
              >
                {actionLabel}
              </button>
            </section>

            {filteredBookings.length === 0 ? (
              <section className="po-bookings-empty">
                <strong>{emptyMessage}</strong>
                <p>
                  {emptyDescription ||
                    `Try a different search or filter, or create a walk-in guest entry for visitors who arrived directly at ${assignedSpot.name}.`}
                </p>
              </section>
            ) : (
              <>
                <section className="po-bookings-grid">
                  {paginatedItems.map((booking) => {
                    const statusMeta = getStatusMeta(booking.status);
                    return (
                      <article key={booking._id || booking.bookingId} className="po-booking-card">
                        <div className="po-booking-card-top">
                          <div className="po-booking-guest">
                            <div className="po-booking-avatar">
                              {(booking.userFullName || booking.fullName || "G").charAt(0).toUpperCase()}
                            </div>

                            <div className="po-booking-guest-copy">
                              <h3>{booking.userFullName || booking.fullName || "Guest booking"}</h3>
                              <p>{booking.touristSpotName || booking.establishmentName || assignedSpot.name}</p>
                              <small>{booking.bookingId || booking._id || "Booking record"}</small>
                            </div>
                          </div>

                          <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                        </div>

                        <div className="po-booking-meta-grid">
                          <div className="po-booking-meta-item">
                            <span>Visit Date</span>
                            <strong>
                              {formatDate(
                                booking.visitDate || booking.checkInDate || booking.createdAt,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </strong>
                          </div>

                          <div className="po-booking-meta-item">
                            <span>Total Guests</span>
                            <strong>{booking.totalGuests || booking.maxPersons || 1}</strong>
                          </div>

                          <div className="po-booking-meta-item">
                            <span>Contact Number</span>
                            <strong>{booking.contactNumber || "Not available"}</strong>
                          </div>

                          <div className="po-booking-meta-item">
                            <span>Total Amount</span>
                            <strong>{formatCurrency(booking.totalAmount || booking.roomPrice || booking.entranceFee)}</strong>
                          </div>
                        </div>

                        <div className="po-booking-highlight-row">
                          <span className="po-booking-highlight">
                            {isWalkInBooking(booking) ? "Walk-in Guest" : "Online Booking"}
                          </span>
                          <span className="po-booking-highlight po-booking-highlight--muted">
                            {booking.paymentStatus || "Payment not set"}
                          </span>
                        </div>

                        <div className="po-booking-actions">
                          <button
                            type="button"
                            className="po-booking-action po-booking-action--secondary"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            View Details
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>

                <Pagination
                  currentPage={currentPage}
                  itemLabel="guest bookings"
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  totalPages={totalPages}
                />
              </>
            )}
          </>
        )}

        {selectedBooking ? (
          <div className="po-booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="po-booking-modal" onClick={(event) => event.stopPropagation()}>
              <div className="po-booking-modal-header">
                <div>
                  <span className="po-bookings-kicker">Guest Booking</span>
                  <h3>{selectedBooking.userFullName || selectedBooking.fullName || "Guest booking"}</h3>
                  <p>{selectedBooking.touristSpotName || selectedBooking.establishmentName || assignedSpot?.name}</p>
                </div>

                <button
                  type="button"
                  className="po-booking-modal-close"
                  onClick={() => setSelectedBooking(null)}
                  aria-label="Close booking details"
                >
                  x
                </button>
              </div>

              <div className="po-booking-modal-grid">
                <div className="po-booking-modal-card">
                  <span>Booking ID</span>
                  <strong>{selectedBooking.bookingId || selectedBooking._id || "Not available"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Status</span>
                  <strong>{selectedBooking.status || "Pending"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Guest Source</span>
                  <strong>{isWalkInBooking(selectedBooking) ? "Walk-in Guest" : "Online Booking"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Payment Status</span>
                  <strong>{selectedBooking.paymentStatus || "Not set"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Visit Date</span>
                  <strong>{formatDate(selectedBooking.visitDate || selectedBooking.checkInDate, { month: "long", day: "numeric", year: "numeric" })}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(selectedBooking.totalAmount || selectedBooking.roomPrice || selectedBooking.entranceFee)}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Contact Number</span>
                  <strong>{selectedBooking.contactNumber || "Not available"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Created At</span>
                  <strong>{formatDateTime(selectedBooking.createdAt)}</strong>
                </div>
              </div>

              <div className="po-booking-proof-shell">
                <div className="po-booking-proof-copy">
                  <span>Guest Notes</span>
                  <strong>
                    {selectedBooking.bookingMetadata?.notes ||
                      selectedBooking.notes ||
                      "No notes were saved for this guest record."}
                  </strong>
                </div>
              </div>

              <div className="po-booking-guest-list">
                <div className="po-booking-proof-copy">
                  <span>Guest List</span>
                  <strong>
                    {(selectedBooking.guestDetails || []).filter((guest) => guest.fullName).length || 1} guest record(s)
                  </strong>
                </div>

                {(selectedBooking.guestDetails || []).filter((guest) => guest.fullName).length > 0 ? (
                  <div className="po-booking-guest-list-grid">
                    {selectedBooking.guestDetails
                      .filter((guest) => guest.fullName)
                      .map((guest, index) => (
                        <article key={`${guest.fullName}-${index}`} className="po-booking-guest-list-card">
                          <strong>{guest.fullName}</strong>
                          <small>{guest.isHeadGuest ? "Head guest" : "Guest"}</small>
                          <span>{guest.contactNumber || "No contact number"}</span>
                          {guest.notes ? <p>{guest.notes}</p> : null}
                        </article>
                      ))}
                  </div>
                ) : (
                  <p className="po-booking-guest-list-empty">No extra guest records were saved yet.</p>
                )}
              </div>

              <div className="po-booking-modal-actions">
                <button
                  type="button"
                  className="po-booking-action po-booking-action--secondary"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isFormOpen ? (
          <div className="po-booking-modal-overlay" onClick={closeWalkInModal}>
            <div
              className="po-booking-modal po-booking-modal--form"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="po-booking-modal-header">
                <div>
                  <span className="po-bookings-kicker">Walk-in Guest</span>
                  <h3>Add a walk-in guest for {assignedSpot?.name || "your tourist spot"}</h3>
                  <p>
                    Record manual guest arrivals so tourism site manager bookings stay visible in the
                    same assigned-spot history.
                  </p>
                </div>

                <button
                  type="button"
                  className="po-booking-modal-close"
                  onClick={closeWalkInModal}
                  aria-label="Close form"
                >
                  x
                </button>
              </div>

              <div className="po-booking-form-grid">
                <label className="po-booking-form-field">
                  <span>Tourist Spot</span>
                  <input type="text" value={assignedSpot?.name || ""} readOnly />
                </label>

                <label className="po-booking-form-field">
                  <span>Head Guest Name</span>
                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={(event) => updateFormField("fullName", event.target.value)}
                    placeholder="Enter the head guest name"
                  />
                </label>

                <label className="po-booking-form-field">
                  <span>Contact Number</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="11"
                    value={formState.contactNumber}
                    onChange={(event) =>
                      updateFormField("contactNumber", event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="09XXXXXXXXX"
                  />
                </label>

                <label className="po-booking-form-field">
                  <span>Visit Date</span>
                  <input
                    type="date"
                    value={formState.visitDate}
                    onChange={(event) => updateFormField("visitDate", event.target.value)}
                  />
                </label>

                <label className="po-booking-form-field">
                  <span>Total Guests</span>
                  <input
                    type="number"
                    min="1"
                    value={formState.totalGuests}
                    onChange={(event) => updateFormField("totalGuests", event.target.value)}
                  />
                </label>

                <label className="po-booking-form-field">
                  <span>Entrance Fee Total</span>
                  <input
                    type="number"
                    min="0"
                    value={formState.amount}
                    onChange={(event) => updateFormField("amount", event.target.value)}
                    placeholder="Enter the total walk-in amount"
                  />
                </label>

                <label className="po-booking-form-field">
                  <span>Initial Status</span>
                  <select
                    value={formState.initialStatus}
                    onChange={(event) => updateFormField("initialStatus", event.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>

                <label className="po-booking-form-field">
                  <span>Guest Origin</span>
                  <input
                    type="text"
                    value={formState.guestOrigin}
                    onChange={(event) => updateFormField("guestOrigin", event.target.value)}
                    placeholder="Barangay, municipality, or province"
                  />
                </label>

                <label className="po-booking-form-checkbox po-booking-form-field--full">
                  <input
                    type="checkbox"
                    checked={formState.markAsPaid}
                    onChange={(event) => updateFormField("markAsPaid", event.target.checked)}
                  />
                  <span>Mark walk-in payment as paid immediately</span>
                </label>

                <label className="po-booking-form-field po-booking-form-field--full">
                  <span>Notes</span>
                  <textarea
                    rows="3"
                    value={formState.notes}
                    onChange={(event) => updateFormField("notes", event.target.value)}
                    placeholder="Add any tourism visit notes or reminders"
                  />
                </label>
              </div>

              <div className="po-booking-guest-editor">
                <div className="po-booking-guest-editor-header">
                  <div>
                    <span>Additional Guests</span>
                    <strong>Add companions under the same walk-in record</strong>
                  </div>

                  <button
                    type="button"
                    className="po-booking-action po-booking-action--secondary"
                    onClick={addGuestRow}
                  >
                    Add Guest
                  </button>
                </div>

                <div className="po-booking-guest-editor-list">
                  {formState.guestRows.map((guest, index) => (
                    <div key={`tm-guest-row-${index}`} className="po-booking-guest-editor-row">
                      <input
                        type="text"
                        value={guest.fullName}
                        onChange={(event) => updateGuestRow(index, "fullName", event.target.value)}
                        placeholder="Guest full name"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="11"
                        value={guest.contactNumber}
                        onChange={(event) =>
                          updateGuestRow(index, "contactNumber", event.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Contact number"
                      />
                      <input
                        type="text"
                        value={guest.notes}
                        onChange={(event) => updateGuestRow(index, "notes", event.target.value)}
                        placeholder="Notes"
                      />
                      <button
                        type="button"
                        className="po-booking-guest-remove"
                        onClick={() => removeGuestRow(index)}
                        aria-label="Remove guest"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {formError ? <p className="po-booking-form-error">{formError}</p> : null}

              <div className="po-booking-modal-actions">
                <button
                  type="button"
                  className="po-booking-action po-booking-action--secondary"
                  onClick={closeWalkInModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="po-booking-action po-booking-action--primary"
                  disabled={isSubmittingForm}
                  onClick={handleSubmitWalkIn}
                >
                  {isSubmittingForm ? "Saving..." : "Save Walk-in Guest"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {toast.visible ? (
        <div className={`po-bk-toast po-bk-toast--${toast.type}`} role="alert">
          <span>{toast.message}</span>
          <button
            type="button"
            className="po-bk-toast-close"
            onClick={() => setToast({ visible: false, type: "", message: "" })}
          >
            x
          </button>
        </div>
      ) : null}
    </div>
  );
}
