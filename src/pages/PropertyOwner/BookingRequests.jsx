import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Pagination from "../../components/Pagination";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import usePagination from "../../hooks/usePagination";
import "./BookingRequests.css";
import MenuButton from "../../components/MenuButton";
import { API_URL, BASE_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";

const STATUS_TABS = [
  { value: "All", label: "All Bookings" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
];

const STATUS_FILTERS = ["All", "Pending", "Completed", "Rejected", "Cancelled"];
const SOURCE_FILTERS = ["All", "Walk-in", "Online"];

function createGuestRow() {
  return {
    fullName: "",
    contactNumber: "",
    notes: "",
  };
}

function formatDate(dateValue, options) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-PH", options);
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
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

function getLatestStatusEntry(booking) {
  const history = Array.isArray(booking?.statusHistory) ? booking.statusHistory : [];
  if (!history.length) return null;

  return [...history].sort(
    (left, right) => new Date(right.changedAt).getTime() - new Date(left.changedAt).getTime()
  )[0];
}

function formatCurrency(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Not set";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function getBookingStay(booking) {
  return `${formatDate(booking.checkInDate, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${formatDate(booking.checkOutDate, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function getBookingNights(booking) {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null;
  const diff = checkOut - checkIn;
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(nights) || nights <= 0) return null;
  return nights;
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

function isWalkInBooking(booking) {
  return (
    String(booking?.paymentMethod || "").toUpperCase() === "WALK_IN" ||
    String(booking?.bookingMetadata?.source || "").toUpperCase() === "OWNER_WALK_IN"
  );
}

function buildGuestFormFromBooking(booking) {
  const guestDetails = Array.isArray(booking?.guestDetails) ? booking.guestDetails : [];
  const headGuest =
    guestDetails.find((guest) => guest.isHeadGuest) ||
    guestDetails[0] || {
      fullName: booking?.headGuestName || booking?.fullName || "",
      contactNumber: booking?.headGuestContactNumber || booking?.contactNumber || "",
      notes: "",
    };

  const otherGuests = guestDetails
    .filter((guest, index) => guest.fullName && !(index === 0 && guest.fullName === headGuest.fullName))
    .filter((guest) => !guest.isHeadGuest || guest.fullName !== headGuest.fullName)
    .map((guest) => ({
      fullName: guest.fullName || "",
      contactNumber: guest.contactNumber || "",
      notes: guest.notes || "",
    }));

  return {
    accommodationId: booking?.accommodationId || "",
    roomType: booking?.roomType || "",
    fullName: headGuest.fullName || booking?.fullName || "",
    contactNumber: headGuest.contactNumber || booking?.contactNumber || "",
    checkInDate: formatDateInput(booking?.checkInDate),
    checkOutDate: formatDateInput(booking?.checkOutDate),
    maxPersons: String(booking?.maxPersons || booking?.totalGuests || 1),
    guestOrigin: booking?.bookingMetadata?.guestOrigin || "",
    notes: booking?.bookingMetadata?.notes || "",
    initialStatus: booking?.status || "Pending",
    markAsPaid: booking?.paymentStatus === "PAID",
    guestRows: otherGuests.length ? otherGuests : [createGuestRow()],
  };
}

function buildGuestPayload(formState) {
  const headGuest = {
    fullName: String(formState.fullName || "").trim(),
    contactNumber: String(formState.contactNumber || "").trim(),
    isHeadGuest: true,
    notes: "",
  };

  const guests = [headGuest].concat(
    (Array.isArray(formState.guestRows) ? formState.guestRows : [])
      .map((guest) => ({
        fullName: String(guest.fullName || "").trim(),
        contactNumber: String(guest.contactNumber || "").trim(),
        isHeadGuest: false,
        notes: String(guest.notes || "").trim(),
      }))
      .filter((guest) => guest.fullName)
  );

  return guests;
}

function getRoomFromAccommodation(accommodation, roomType) {
  if (!accommodation || !Array.isArray(accommodation.rooms)) return null;
  return accommodation.rooms.find((room) => room.roomName === roomType) || null;
}

export default function BookingRequests() {
  const ownerId = localStorage.getItem("ownerId") || "";
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState({ bookingId: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [formModal, setFormModal] = useState({ mode: "", booking: null });
  const [formState, setFormState] = useState({
    accommodationId: "",
    roomType: "",
    fullName: "",
    contactNumber: "",
    checkInDate: "",
    checkOutDate: "",
    maxPersons: "1",
    guestOrigin: "",
    notes: "",
    initialStatus: "Pending",
    markAsPaid: false,
    guestRows: [createGuestRow()],
  });
  const [formError, setFormError] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const authHeaders = useMemo(() => buildAuthHeaders("propertyOwner"), []);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ visible: false, type: "", message: "" });

  const showToast = useCallback((message, type = "error") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, type, message });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, type: "", message: "" }), 4000);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const loadBookings = useCallback(async () => {
    const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
    const response = await fetch(`${API_URL}/bookings${query}`, {
      headers: authHeaders,
    });
    const data = await response.json();
    setBookings(Array.isArray(data) ? data : []);
  }, [authHeaders, ownerId]);

  const loadAccommodations = useCallback(async () => {
    const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
    const response = await fetch(`${API_URL}/accommodations${query}`, {
      headers: authHeaders,
    });
    const data = await response.json();
    setAccommodations(Array.isArray(data) ? data : []);
  }, [authHeaders, ownerId]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([loadBookings(), loadAccommodations()])
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setBookings([]);
          setAccommodations([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadAccommodations, loadBookings]);

  const bookingStats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "Pending").length,
      completed: bookings.filter((booking) => booking.status === "Completed").length,
      walkIn: bookings.filter((booking) => isWalkInBooking(booking)).length,
    }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesTab = activeTab === "All" ? true : booking.status === activeTab;
      const matchesStatus = statusFilter === "All" ? true : booking.status === statusFilter;
      const bookingSource = isWalkInBooking(booking) ? "Walk-in" : "Online";
      const matchesSource = sourceFilter === "All" ? true : bookingSource === sourceFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          booking.userFullName,
          booking.fullName,
          booking.accommodationName,
          booking.establishmentName,
          booking.bookingId,
          booking.contactNumber,
          booking.headGuestName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      return matchesTab && matchesStatus && matchesSource && matchesSearch;
    });
  }, [activeTab, bookings, searchTerm, sourceFilter, statusFilter]);

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
    resetKey: `${activeTab}-${statusFilter}-${sourceFilter}-${searchTerm}-${bookings.length}`,
  });

  const selectedAccommodation = useMemo(
    () => accommodations.find((item) => String(item._id) === String(formState.accommodationId)) || null,
    [accommodations, formState.accommodationId]
  );

  const selectedRoom = useMemo(
    () => getRoomFromAccommodation(selectedAccommodation, formState.roomType),
    [selectedAccommodation, formState.roomType]
  );

  const openWalkInModal = () => {
    const fallbackAccommodation = accommodations[0] || null;
    const fallbackRoom = fallbackAccommodation?.rooms?.[0] || null;

    setFormModal({ mode: "create", booking: null });
    setFormError("");
    setFormState({
      accommodationId: fallbackAccommodation?._id || "",
      roomType: fallbackRoom?.roomName || "",
      fullName: "",
      contactNumber: "",
      checkInDate: "",
      checkOutDate: "",
      maxPersons: String(fallbackRoom?.maxPersons || 1),
      guestOrigin: "",
      notes: "",
      initialStatus: "Pending",
      markAsPaid: false,
      guestRows: [createGuestRow()],
    });
  };

  const openEditModal = (booking) => {
    setFormModal({ mode: "edit", booking });
    setFormError("");
    setFormState(buildGuestFormFromBooking(booking));
  };

  const closeFormModal = () => {
    setFormModal({ mode: "", booking: null });
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

  const handleAccommodationChange = (accommodationId) => {
    const nextAccommodation =
      accommodations.find((item) => String(item._id) === String(accommodationId)) || null;
    const nextRoom = nextAccommodation?.rooms?.[0] || null;

    setFormState((current) => ({
      ...current,
      accommodationId,
      roomType: nextRoom?.roomName || "",
      maxPersons: String(nextRoom?.maxPersons || current.maxPersons || 1),
    }));
  };

  const handleRoomTypeChange = (roomType) => {
    const nextRoom = getRoomFromAccommodation(selectedAccommodation, roomType);

    setFormState((current) => ({
      ...current,
      roomType,
      maxPersons: String(nextRoom?.maxPersons || current.maxPersons || 1),
    }));
  };

  const handleBookingAction = async (booking, nextStatus) => {
    const endpoint = nextStatus === "Rejected" ? "reject" : "complete";
    setActionState({ bookingId: booking._id, type: endpoint });

    try {
      const res = await fetch(`${API_URL}/bookings/${booking._id}/${endpoint}`, {
        method: "PATCH",
        headers: authHeaders,
      });
      const result = await res.json();

      if (!res.ok) {
        showToast(result.message || "Unable to update booking right now.");
        return;
      }

      await loadBookings();

      if (selectedBooking?._id === booking._id) {
        setSelectedBooking(result.booking || { ...selectedBooking, status: nextStatus });
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong while updating the booking.");
    } finally {
      setActionState({ bookingId: "", type: "" });
    }
  };

  const handleWalkInPaid = async (booking) => {
    setActionState({ bookingId: booking._id, type: "payment" });

    try {
      const res = await fetch(`${API_URL}/bookings/${booking._id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          paymentMethod: "WALK_IN",
          markAsPaid: true,
          paymentStatus: "PAID",
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        showToast(result.message || "Unable to update payment right now.");
        return;
      }

      await loadBookings();
      if (selectedBooking?._id === booking._id) {
        setSelectedBooking(result.booking || selectedBooking);
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong while updating the payment.");
    } finally {
      setActionState({ bookingId: "", type: "" });
    }
  };

  const handleSubmitForm = async () => {
    setFormError("");

    if (!String(formState.fullName || "").trim()) {
      setFormError("Guest full name is required.");
      return;
    }

    if (!/^[0-9]{11}$/.test(String(formState.contactNumber || "").trim())) {
      setFormError("Contact number must be 11 digits.");
      return;
    }

    if (formModal.mode === "create") {
      if (!formState.accommodationId) {
        setFormError("Please select an accommodation.");
        return;
      }

      if (!formState.roomType) {
        setFormError("Please select a room type.");
        return;
      }

      if (!formState.checkInDate || !formState.checkOutDate) {
        setFormError("Check-in and check-out dates are required.");
        return;
      }
    }

    setIsSubmittingForm(true);

    const payload = {
      fullName: formState.fullName,
      contactNumber: formState.contactNumber,
      maxPersons: Number(formState.maxPersons || 1),
      guestOrigin: formState.guestOrigin,
      notes: formState.notes,
      guestDetails: buildGuestPayload(formState),
    };

    try {
      let response;

      if (formModal.mode === "create") {
        response = await fetch(`${API_URL}/property-owner/bookings/walk-in`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            ...payload,
            accommodationId: formState.accommodationId,
            roomType: formState.roomType,
            roomPrice: Number(selectedRoom?.price || 0),
            checkInDate: formState.checkInDate,
            checkOutDate: formState.checkOutDate,
            initialStatus: formState.initialStatus,
            paymentMethod: "WALK_IN",
            paymentStatus: formState.markAsPaid ? "PAID" : "UNPAID",
            markAsPaid: formState.markAsPaid,
          }),
        });
      } else {
        response = await fetch(`${API_URL}/bookings/${formModal.booking._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        setFormError(result.message || "Unable to save guest details right now.");
        return;
      }

      await Promise.all([loadBookings(), loadAccommodations()]);

      if (formModal.mode === "edit" && selectedBooking?._id === formModal.booking?._id) {
        setSelectedBooking(result.booking || selectedBooking);
      }

      closeFormModal();
    } catch (error) {
      console.error(error);
      setFormError("Something went wrong while saving guest details.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="booking-requests"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main">
        <section className="po-bookings-header">
          <div className="po-bookings-header-main">
            <div className="po-bookings-header-left">
              {sidebarHidden ? (
                <MenuButton
                  onClick={(event) => {
                    event.stopPropagation();
                    setSidebarHidden(false);
                  }}
                />
              ) : null}

              <div className="po-bookings-copy">
                <span className="po-bookings-kicker">Reservation Desk</span>
                <h1>Manage online bookings and walk-in guests from one property owner panel.</h1>
                <p>
                  Review status changes, add manual walk-in entries, and keep guest details current
                  for every reservation tied to your accommodation listings.
                </p>
              </div>
            </div>

            <div className="po-bookings-header-badge">
              <span>Total Bookings</span>
              <strong>{bookingStats.total}</strong>
              <small>Across all statuses and booking sources</small>
            </div>
          </div>
        </section>

        <section className="po-bookings-summary-grid">
          <article className="po-bookings-summary-card">
            <span>Total Bookings</span>
            <strong>{bookingStats.total}</strong>
            <small>All online and walk-in reservations under your listings</small>
          </article>

          <article className="po-bookings-summary-card po-bookings-summary-card--pending">
            <span>Pending</span>
            <strong>{bookingStats.pending}</strong>
            <small>Requests waiting for owner action</small>
          </article>

          <article className="po-bookings-summary-card po-bookings-summary-card--completed">
            <span>Completed</span>
            <strong>{bookingStats.completed}</strong>
            <small>Closed reservations that remain in your audit trail</small>
          </article>

          <article className="po-bookings-summary-card po-bookings-summary-card--walkin">
            <span>Walk-in</span>
            <strong>{bookingStats.walkIn}</strong>
            <small>Owner-created walk-in guest entries</small>
          </article>
        </section>

        <section className="po-bookings-controls">
          <div className="po-bookings-tab-group">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`po-bookings-tab ${activeTab === tab.value ? "po-bookings-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{tab.value === "All" ? bookingStats.total : bookingStats[tab.value.toLowerCase()] || 0}</strong>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="po-booking-action po-booking-action--primary"
            onClick={openWalkInModal}
          >
            Add Walk-in Guest
          </button>
        </section>

        <section className="po-bookings-filter-bar">
          <label className="po-bookings-filter-field po-bookings-filter-field--search">
            <span>Search</span>
            <input
              type="search"
              placeholder="Search guest, booking ID, contact, or accommodation"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label className="po-bookings-filter-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="po-bookings-filter-field">
            <span>Source</span>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {SOURCE_FILTERS.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
        </section>
        {isLoading ? (
          <div className="po-bookings-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="po-booking-card po-booking-card--shimmer">
                <div className="po-bk-shimmer-top">
                  <div className="po-bk-shimmer po-bk-shimmer--avatar" />
                  <div className="po-bk-shimmer-lines">
                    <div className="po-bk-shimmer po-bk-shimmer--line po-bk-shimmer--lg" />
                    <div className="po-bk-shimmer po-bk-shimmer--line po-bk-shimmer--md" />
                    <div className="po-bk-shimmer po-bk-shimmer--line po-bk-shimmer--sm" />
                  </div>
                  <div className="po-bk-shimmer po-bk-shimmer--badge" />
                </div>
                <div className="po-booking-meta-grid">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={j} className="po-booking-meta-item">
                      <div className="po-bk-shimmer po-bk-shimmer--line po-bk-shimmer--sm" style={{ marginBottom: 8 }} />
                      <div className="po-bk-shimmer po-bk-shimmer--line po-bk-shimmer--md" />
                    </div>
                  ))}
                </div>
                <div className="po-booking-highlight-row">
                  <div className="po-bk-shimmer po-bk-shimmer--pill" />
                  <div className="po-bk-shimmer po-bk-shimmer--pill" />
                </div>
                <div className="po-booking-actions">
                  <div className="po-bk-shimmer po-bk-shimmer--btn" />
                  <div className="po-bk-shimmer po-bk-shimmer--btn" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="po-bookings-empty">
            <strong>No bookings matched this view.</strong>
            <p>Try a different status or search term, or add a new walk-in guest from this panel.</p>
          </div>
        ) : (
          <>
            <section className="po-bookings-grid">
              {paginatedItems.map((booking) => {
                const statusMeta = getStatusMeta(booking.status);
                const nights = getBookingNights(booking);
                const sourceLabel = isWalkInBooking(booking) ? "Walk-in" : "Online booking";
                const latestStatusEntry = getLatestStatusEntry(booking);
                const isUpdatingComplete =
                  actionState.bookingId === booking._id && actionState.type === "complete";
                const isUpdatingReject =
                  actionState.bookingId === booking._id && actionState.type === "reject";

                return (
                  <article key={booking._id} className="po-booking-card">
                    <div className="po-booking-card-top">
                      <div className="po-booking-guest">
                        <div className="po-booking-avatar">
                          {booking.userProfileImage ? (
                            <img
                              src={`${BASE_URL}${booking.userProfileImage}`}
                              alt={booking.userFullName}
                              className="po-booking-avatar-img"
                            />
                          ) : (
                            <span>{(booking.userFullName || booking.fullName || "G").charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="po-booking-guest-copy">
                          <h3>{booking.userFullName || booking.fullName || "Guest"}</h3>
                          <p>{booking.accommodationName || booking.establishmentName || "Accommodation booking"}</p>
                          <small>{booking.bookingId || booking._id}</small>
                          <small>Created {formatDateTime(booking.createdAt)}</small>
                          {latestStatusEntry ? <small>Status updated {formatDateTime(latestStatusEntry.changedAt)}</small> : null}
                        </div>
                      </div>

                      <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                    </div>

                    <div className="po-booking-meta-grid">
                      <div className="po-booking-meta-item">
                        <span>Source</span>
                        <strong>{sourceLabel}</strong>
                      </div>
                      <div className="po-booking-meta-item">
                        <span>Stay Schedule</span>
                        <strong>{getBookingStay(booking)}</strong>
                      </div>
                      <div className="po-booking-meta-item">
                        <span>Guest Count</span>
                        <strong>{booking.totalGuests || booking.maxPersons || 1} guest(s)</strong>
                      </div>
                      <div className="po-booking-meta-item">
                        <span>Booking Value</span>
                        <strong>{formatCurrency(booking.totalAmount || booking.roomPrice)}</strong>
                      </div>
                    </div>

                    <div className="po-booking-highlight-row">
                      <span className="po-booking-highlight">
                        {nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Custom stay"}
                      </span>
                      <span className="po-booking-highlight po-booking-highlight--muted">
                        {(booking.paymentMethodLabel || booking.paymentMethod || "Payment") +
                          " • " +
                          (booking.paymentStatusLabel || booking.paymentStatus || "Not set")}
                      </span>
                      {booking.bookingMetadata?.guestOrigin ? (
                        <span className="po-booking-highlight po-booking-highlight--muted">
                          Origin: {booking.bookingMetadata.guestOrigin}
                        </span>
                      ) : null}
                    </div>

                    <div className="po-booking-actions">
                      <button
                        type="button"
                        className="po-booking-action po-booking-action--secondary"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        View Details
                      </button>

                      {booking.status === "Pending" ? (
                        <button
                          type="button"
                          className="po-booking-action po-booking-action--secondary"
                          onClick={() => openEditModal(booking)}
                        >
                          Manage Guests
                        </button>
                      ) : null}

                      {booking.status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            className="po-booking-action po-booking-action--primary"
                            onClick={() => handleBookingAction(booking, "Completed")}
                            disabled={isUpdatingComplete}
                          >
                            {isUpdatingComplete ? "Completing..." : "Mark as Completed"}
                          </button>
                          <button
                            type="button"
                            className="po-booking-action po-booking-action--danger"
                            onClick={() => handleBookingAction(booking, "Rejected")}
                            disabled={isUpdatingReject}
                          >
                            {isUpdatingReject ? "Rejecting..." : "Reject"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>

            <Pagination
              currentPage={currentPage}
              itemLabel="bookings"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
            />
          </>
        )}

        {selectedBooking ? (
          <div className="po-booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="po-booking-modal" onClick={(event) => event.stopPropagation()}>
              <div className="po-booking-modal-header">
                <div>
                  <span className="po-bookings-kicker">Booking Details</span>
                  <h3>{selectedBooking.userFullName || selectedBooking.fullName || "Guest Booking"}</h3>
                  <small>{selectedBooking.bookingId || selectedBooking._id}</small>
                  <p>
                    {selectedBooking.accommodationName || selectedBooking.establishmentName || "Accommodation booking"} •{" "}
                    {getBookingStay(selectedBooking)}
                  </p>
                </div>

                <button
                  type="button"
                  className="po-booking-modal-close"
                  onClick={() => setSelectedBooking(null)}
                  aria-label="Close booking details"
                >
                  ×
                </button>
              </div>

              <div className="po-booking-modal-grid">
                <div className="po-booking-modal-card">
                  <span>Guest Name</span>
                  <strong>{selectedBooking.userFullName || selectedBooking.fullName || "Guest"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Contact Number</span>
                  <strong>{selectedBooking.contactNumber || "Not available"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Status</span>
                  <strong>{selectedBooking.status || "Pending"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Booking Source</span>
                  <strong>{isWalkInBooking(selectedBooking) ? "Walk-in Guest" : "Online Booking"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Room Type</span>
                  <strong>{selectedBooking.roomType || "Optional room type"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(selectedBooking.totalAmount || selectedBooking.roomPrice)}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Payment Method</span>
                  <strong>{selectedBooking.paymentMethodLabel || selectedBooking.paymentMethod || "Not set"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Payment Status</span>
                  <strong>{selectedBooking.paymentStatusLabel || selectedBooking.paymentStatus || "Not set"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Receipt Number</span>
                  <strong>{selectedBooking.receiptNumber || "Not available"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Guest Origin</span>
                  <strong>{selectedBooking.bookingMetadata?.guestOrigin || "Not provided"}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Check-in</span>
                  <strong>{formatDate(selectedBooking.checkInDate, { month: "long", day: "numeric", year: "numeric" })}</strong>
                </div>
                <div className="po-booking-modal-card">
                  <span>Check-out</span>
                  <strong>{formatDate(selectedBooking.checkOutDate, { month: "long", day: "numeric", year: "numeric" })}</strong>
                </div>
              </div>

              <div className="po-booking-proof-shell">
                <div className="po-booking-proof-copy">
                  <span>Guest Notes</span>
                  <strong>{selectedBooking.bookingMetadata?.notes || "No guest notes were saved for this booking."}</strong>
                </div>
              </div>

              <div className="po-booking-status-history">
                <div className="po-booking-proof-copy">
                  <span>Status History</span>
                  <strong>Track when this booking changed status and who triggered the update.</strong>
                </div>

                <div className="po-booking-status-history-list">
                  {(Array.isArray(selectedBooking.statusHistory) ? [...selectedBooking.statusHistory] : [])
                    .sort((left, right) => new Date(right.changedAt) - new Date(left.changedAt))
                    .map((entry, index) => (
                      <article
                        key={`${entry.status}-${entry.changedAt}-${index}`}
                        className="po-booking-status-history-item"
                      >
                        <div>
                          <strong>{entry.status || "Pending"}</strong>
                          <small>{formatDateTime(entry.changedAt)}</small>
                        </div>
                        <div>
                          <span>{entry.changedByRole || "system"}</span>
                          {entry.note ? <p>{entry.note}</p> : null}
                        </div>
                      </article>
                    ))}
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
                  <p className="po-booking-guest-list-empty">No extra guests have been added yet.</p>
                )}
              </div>

              {selectedBooking.proofImage ? (
                <div className="po-booking-proof-shell">
                  <div className="po-booking-proof-copy">
                    <span>Proof of Payment</span>
                    <strong>Uploaded payment screenshot</strong>
                  </div>
                  <img
                    src={`${BASE_URL}${selectedBooking.proofImage}`}
                    alt="Proof of payment"
                    className="po-booking-proof-img"
                  />
                </div>
              ) : null}

              <div className="po-booking-modal-actions">
                {selectedBooking.status === "Pending" ? (
                  <button
                    type="button"
                    className="po-booking-action po-booking-action--secondary"
                    onClick={() => openEditModal(selectedBooking)}
                  >
                    Manage Guests
                  </button>
                ) : null}
                {selectedBooking.paymentMethod === "WALK_IN" &&
                selectedBooking.paymentStatus !== "PAID" ? (
                  <button
                    type="button"
                    className="po-booking-action po-booking-action--primary"
                    onClick={() => handleWalkInPaid(selectedBooking)}
                    disabled={actionState.bookingId === selectedBooking._id && actionState.type === "payment"}
                  >
                    {actionState.bookingId === selectedBooking._id && actionState.type === "payment"
                      ? "Updating Payment..."
                      : "Mark Walk-in as Paid"}
                  </button>
                ) : null}
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

        {formModal.mode ? (
          <div className="po-booking-modal-overlay" onClick={closeFormModal}>
            <div className="po-booking-modal po-booking-modal--form" onClick={(event) => event.stopPropagation()}>
              <div className="po-booking-modal-header">
                <div>
                  <span className="po-bookings-kicker">
                    {formModal.mode === "create" ? "Walk-in Guest" : "Manage Guests"}
                  </span>
                  <h3>
                    {formModal.mode === "create"
                      ? "Add a walk-in guest"
                      : `Update guest details for ${formModal.booking?.bookingId || "this booking"}`}
                  </h3>
                  <p>
                    {formModal.mode === "create"
                      ? "Create a manual guest record that stays visible in your booking history and payment workflow."
                      : "Update the head guest and extra guest list without replacing the booking itself."}
                  </p>
                </div>

                <button
                  type="button"
                  className="po-booking-modal-close"
                  onClick={closeFormModal}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              <div className="po-booking-form-grid">
                {formModal.mode === "create" ? (
                  <>
                    <label className="po-booking-form-field">
                      <span>Accommodation</span>
                      <select
                        value={formState.accommodationId}
                        onChange={(event) => handleAccommodationChange(event.target.value)}
                      >
                        <option value="">Select an accommodation</option>
                        {accommodations.map((accommodation) => (
                          <option key={accommodation._id} value={accommodation._id}>
                            {accommodation.accommodationName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="po-booking-form-field">
                      <span>Room Type</span>
                      <select
                        value={formState.roomType}
                        onChange={(event) => handleRoomTypeChange(event.target.value)}
                      >
                        <option value="">Select a room type</option>
                        {(selectedAccommodation?.rooms || []).map((room) => (
                          <option key={room.roomName} value={room.roomName}>
                            {room.roomName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}

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
                    onChange={(event) => updateFormField("contactNumber", event.target.value.replace(/\D/g, ""))}
                    placeholder="09XXXXXXXXX"
                  />
                </label>

                {formModal.mode === "create" ? (
                  <>
                    <label className="po-booking-form-field">
                      <span>Check-in Date</span>
                      <input
                        type="date"
                        value={formState.checkInDate}
                        onChange={(event) => updateFormField("checkInDate", event.target.value)}
                      />
                    </label>

                    <label className="po-booking-form-field">
                      <span>Check-out Date</span>
                      <input
                        type="date"
                        value={formState.checkOutDate}
                        onChange={(event) => updateFormField("checkOutDate", event.target.value)}
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
                  </>
                ) : null}

                <label className="po-booking-form-field">
                  <span>Total Guests</span>
                  <input
                    type="number"
                    min="1"
                    value={formState.maxPersons}
                    onChange={(event) => updateFormField("maxPersons", event.target.value)}
                  />
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

                {formModal.mode === "create" ? (
                  <label className="po-booking-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formState.markAsPaid}
                      onChange={(event) => updateFormField("markAsPaid", event.target.checked)}
                    />
                    <span>Mark walk-in payment as paid immediately</span>
                  </label>
                ) : null}

                <label className="po-booking-form-field po-booking-form-field--full">
                  <span>Notes</span>
                  <textarea
                    rows="3"
                    value={formState.notes}
                    onChange={(event) => updateFormField("notes", event.target.value)}
                    placeholder="Add any guest notes or special instructions"
                  />
                </label>
              </div>

              <div className="po-booking-guest-editor">
                <div className="po-booking-guest-editor-header">
                  <div>
                    <span>Additional Guests</span>
                    <strong>Track tourism guests or companions under the same booking</strong>
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
                    <div key={`guest-row-${index}`} className="po-booking-guest-editor-row">
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

              {selectedRoom && formModal.mode === "create" ? (
                <div className="po-booking-proof-shell">
                  <div className="po-booking-proof-copy">
                    <span>Walk-in Summary</span>
                    <strong>
                      {selectedRoom.roomName} • {formatCurrency(selectedRoom.price)} per night • Max {selectedRoom.maxPersons || 1} guest(s)
                    </strong>
                  </div>
                </div>
              ) : null}

              {formError ? <p className="po-booking-form-error">{formError}</p> : null}

              <div className="po-booking-modal-actions">
                <button
                  type="button"
                  className="po-booking-action po-booking-action--secondary"
                  onClick={closeFormModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="po-booking-action po-booking-action--primary"
                  disabled={isSubmittingForm}
                  onClick={handleSubmitForm}
                >
                  {isSubmittingForm
                    ? "Saving..."
                    : formModal.mode === "create"
                      ? "Save Walk-in Guest"
                      : "Update Guest Details"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {toast.visible ? (
        <div className={`po-bk-toast po-bk-toast--${toast.type}`} role="alert">
          <span>{toast.message}</span>
          <button type="button" className="po-bk-toast-close" onClick={() => setToast({ visible: false, type: "", message: "" })}>×</button>
        </div>
      ) : null}
    </div>
  );
}
