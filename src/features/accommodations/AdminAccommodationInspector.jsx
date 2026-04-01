import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MenuButton from "../../components/MenuButton";
import Sidebar from "../../components/Sidebar";
import { BASE_URL, API_URL } from "../../config/api";
import AccommodationStatusBadge from "./AccommodationStatusBadge";
import TrinidadLocationMap from "./TrinidadLocationMap";
import {
  ACCOMMODATION_STATUSES,
  TRINIDAD_DESTINATION,
  formatPhilippineCurrency,
  getAccommodationType,
  normalizeAccommodationRecord,
} from "./accommodationHelpers";

function buildImagePreview(path) {
  if (!path) return "";
  if (String(path).startsWith("data:")) return path;
  if (String(path).startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

export default function AdminAccommodationInspector() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [accommodation, setAccommodation] = useState(null);
  const [status, setStatus] = useState("open");
  const [closedDescription, setClosedDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/accommodations/${id}`)
      .then((response) => response.json())
      .then((data) => {
        const normalized = normalizeAccommodationRecord(data);
        setAccommodation(normalized);
        setStatus(normalized.status || "open");
        setClosedDescription(normalized.closedDescription || "");
      })
      .catch((error) => console.error(error));
  }, [id]);

  const saveStatus = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      await fetch(`${API_URL}/accommodations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          closedDescription,
        }),
      });

      setSaveSuccess(true);
      setAccommodation((current) =>
        current
          ? {
              ...current,
              status,
              closedDescription,
            }
          : current
      );
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!accommodation) return <div className="aad-loading">Loading...</div>;

  return (
    <div className="aad-wrapper">
      <Sidebar
        active="accommodations"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      <main className="aad-main">
        <div className="aad-hero">
          <div className="aad-hero-copy">
            <div className="aad-hero-topline">
              {isSidebarHidden ? <MenuButton onClick={() => setIsSidebarHidden(false)} /> : null}
              <span className="aad-kicker">Accommodation Detail</span>
            </div>
            <h1>{accommodation.accommodationName}</h1>
            <p>
              {getAccommodationType(accommodation)} | {TRINIDAD_DESTINATION.fullLabel}
            </p>
          </div>
          <button className="aad-back-btn" onClick={() => navigate("/admin/accommodations")}>
            Back
          </button>
        </div>

        <div className="aad-grid">
          <div className="aad-primary">
            <div className="aad-card">
              <div className="aad-card-header">
                <h3>Status Management</h3>
                <AccommodationStatusBadge status={status} />
              </div>

              <div className="aad-status-panel">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {ACCOMMODATION_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button className="aad-status-save-btn" disabled={saving} onClick={saveStatus}>
                  {saving ? "Saving..." : "Save Status"}
                </button>
              </div>

              {status === "closed" ? (
                <div className="aad-closed-panel">
                  <label>Closure Notice</label>
                  <textarea
                    className="aad-closed-textarea"
                    placeholder="Explain why the listing is closed and when it may reopen."
                    value={closedDescription}
                    onChange={(event) => setClosedDescription(event.target.value)}
                  />
                </div>
              ) : null}

              {saveSuccess ? <p className="aad-status-success">Status saved successfully.</p> : null}
            </div>

            <div className="aad-card">
              <h3>Listing Details</h3>
              <div className="aad-detail-grid">
                <div className="aad-field">
                  <label>Business Address</label>
                  <p>{accommodation.businessAddress}</p>
                </div>
                <div className="aad-field">
                  <label>Accommodation Type</label>
                  <p>{getAccommodationType(accommodation)}</p>
                </div>
                <div className="aad-field">
                  <label>GCash Number</label>
                  <p>{accommodation.gcashNumber}</p>
                </div>
                <div className="aad-field">
                  <label>GCash Account Name</label>
                  <p>{accommodation.gcashAccountName}</p>
                </div>
              </div>

              <div className="aad-field">
                <label>Description</label>
                <p>{accommodation.description}</p>
              </div>
            </div>

            <div className="aad-card">
              <h3>Location</h3>
              <TrinidadLocationMap location={accommodation.location} canSelect={false} height={320} />
            </div>

            <div className="aad-card">
              <h3>Amenities</h3>
              {accommodation.amenityPricing?.length ? (
                <div className="aad-pricing-grid">
                  {accommodation.amenityPricing.map((item) => (
                    <article key={item.key} className="aad-priced-item">
                      <span>{item.label}</span>
                      <strong>{formatPhilippineCurrency(item.price)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="aad-empty-copy">No amenities were added to this accommodation.</p>
              )}
            </div>

            <div className="aad-card">
              <h3>Activities and Experiences</h3>
              {accommodation.activityPricing?.length ? (
                <div className="aad-pricing-grid">
                  {accommodation.activityPricing.map((item) => (
                    <article key={item.key} className="aad-priced-item">
                      <span>{item.label}</span>
                      <strong>{formatPhilippineCurrency(item.price)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="aad-empty-copy">No activities or experiences were added yet.</p>
              )}
            </div>
          </div>

          <div className="aad-secondary">
            <div className="aad-card">
              <h3>Property Media</h3>
              {accommodation.profileImage ? (
                <div className="aad-profile-img-wrapper">
                  <img
                    src={buildImagePreview(accommodation.profileImage)}
                    alt={accommodation.accommodationName}
                    className="aad-profile-img"
                  />
                </div>
              ) : null}

              <div className="aad-cover-grid">
                {(accommodation.coverImages || []).map((image, index) => (
                  <img key={`cover-${index}`} src={buildImagePreview(image)} alt={`Cover ${index + 1}`} className="aad-cover-img" />
                ))}
              </div>
            </div>

            {accommodation.rooms?.length ? (
              <div className="aad-card">
                <h3>Room Types</h3>
                <div className="aad-rooms-grid">
                  {accommodation.rooms.map((room, index) => (
                    <div key={`room-${index}`} className="aad-room-card">
                      {room.images?.length ? (
                        <img src={buildImagePreview(room.images[0])} alt={room.roomName} className="aad-room-img" />
                      ) : null}
                      <div className="aad-room-info">
                        <h4>{room.roomName}</h4>
                        <p>Price: {Number(room.price).toLocaleString()}</p>
                        <p>Available Rooms: {room.availableRooms}</p>
                        <p>Max Persons: {room.maxPersons}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
