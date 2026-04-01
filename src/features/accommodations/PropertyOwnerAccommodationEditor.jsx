import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal";
import MenuButton from "../../components/MenuButton";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { BASE_URL, API_URL } from "../../config/api";
import AccommodationRoomEditorSection from "./AccommodationRoomEditorSection";
import AccommodationStatusBadge from "./AccommodationStatusBadge";
import PricedFeatureMatrix from "./PricedFeatureMatrix";
import TrinidadLocationMap from "./TrinidadLocationMap";
import {
  ACCOMMODATION_STATUSES,
  ACCOMMODATION_TYPES,
  ACTIVITIES_LIST,
  AMENITIES_LIST,
  TRINIDAD_DESTINATION,
  formatBusinessAddress,
  getAccommodationType,
  getMissingPriceSelections,
  getPricedSelectionsPayload,
  getSelectedPricingKeys,
  isWithinTrinidadBounds,
  normalizeAccommodationRecord,
  normalizeAccommodationStatus,
  togglePricedSelection,
  updatePricedSelectionPrice,
} from "./accommodationHelpers";

function buildImagePreview(path) {
  if (!path) return "";
  if (String(path).startsWith("data:")) return path;
  if (String(path).startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

export default function PropertyOwnerAccommodationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [accommodation, setAccommodation] = useState(null);
  const [originalAccommodation, setOriginalAccommodation] = useState(null);
  const [accommodationType, setAccommodationType] = useState("");
  const [location, setLocation] = useState(null);
  const [amenityPricing, setAmenityPricing] = useState([]);
  const [activityPricing, setActivityPricing] = useState([]);
  const [status, setStatus] = useState("open");
  const [closedDescription, setClosedDescription] = useState("");
  const [profileImage, setProfileImage] = useState({ file: null, preview: "" });
  const [coverImages, setCoverImages] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomData, setRoomData] = useState({});
  const [roomImages, setRoomImages] = useState({});
  const [roomErrors, setRoomErrors] = useState({});

  function applyAccommodationData(rawData, syncOriginal = true) {
    const data = normalizeAccommodationRecord(rawData);

    setAccommodation(data);
    if (syncOriginal) {
      setOriginalAccommodation(data);
    }
    setAccommodationType(getAccommodationType(data));
    setLocation(data.location?.lat ? data.location : null);
    setAmenityPricing(Array.isArray(data.amenityPricing) ? data.amenityPricing : []);
    setActivityPricing(Array.isArray(data.activityPricing) ? data.activityPricing : []);
    setStatus(normalizeAccommodationStatus(data.status));
    setClosedDescription(data.closedDescription || "");
    setProfileImage({ file: null, preview: buildImagePreview(data.profileImage) });
    setCoverImages(
      Array.isArray(data.coverImages)
        ? data.coverImages.map((image) => ({
            existingPath: image,
            preview: buildImagePreview(image),
          }))
        : []
    );

    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    setSelectedRooms(rooms.map((room) => room.roomName));
    setRoomData(
      rooms.reduce((accumulator, room) => {
        accumulator[room.roomName] = {
          price: room.price,
          availableRooms: room.availableRooms,
          maxPersons: String(room.maxPersons),
        };
        return accumulator;
      }, {})
    );
    setRoomImages(
      rooms.reduce((accumulator, room) => {
        accumulator[room.roomName] = Array.isArray(room.images)
          ? room.images.map((image) => ({
              existingPath: image,
              preview: buildImagePreview(image),
            }))
          : [];
        return accumulator;
      }, {})
    );
    setRoomErrors({});
  }

  useEffect(() => {
    fetch(`${API_URL}/accommodations/${id}`)
      .then((response) => response.json())
      .then((data) => applyAccommodationData(data))
      .catch(console.error);
  }, [id]);

  if (!accommodation) return <div className="edit-loading">Loading...</div>;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAccommodation((current) => ({ ...current, [name]: value }));
  };

  const handleProfileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage({
        file,
        preview: String(reader.result || ""),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (event) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImages((current) => [
          ...current,
          { file, preview: String(reader.result || "") },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleRoomInputChange = (room, field, value) => {
    setRoomData((current) => ({
      ...current,
      [room]: {
        ...current[room],
        [field]: value,
      },
    }));
    setRoomErrors((current) => ({
      ...current,
      [room]: {
        ...current[room],
        [field]: "",
      },
    }));
  };

  const handleRoomImageChange = (room, event) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomImages((current) => ({
          ...current,
          [room]: [...(current[room] || []), { file, preview: String(reader.result || "") }],
        }));
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleCancel = () => {
    if (originalAccommodation) {
      applyAccommodationData(originalAccommodation, false);
    }
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    const validationErrors = {};

    selectedRooms.forEach((room) => {
      if (!roomData?.[room]?.price || Number(roomData[room].price) <= 0) {
        validationErrors[room] = { ...validationErrors[room], price: "Room price must be greater than zero." };
      }
      if (!roomData?.[room]?.availableRooms || Number(roomData[room].availableRooms) <= 0) {
        validationErrors[room] = { ...validationErrors[room], availableRooms: "Available rooms must be greater than zero." };
      }
      if (!roomData?.[room]?.maxPersons || Number(roomData[room].maxPersons) <= 0) {
        validationErrors[room] = { ...validationErrors[room], maxPersons: "Max persons is required." };
      }
      if (!roomImages[room]?.length) {
        validationErrors[room] = { ...validationErrors[room], image: "At least one room image is required." };
      }
    });

    if (
      !accommodation.accommodationName?.trim() ||
      !accommodationType ||
      !accommodation.businessAddress?.trim() ||
      !accommodation.description?.trim() ||
      !location ||
      !isWithinTrinidadBounds(location) ||
      !/^09\d{9}$/.test(accommodation.gcashNumber || "") ||
      !accommodation.gcashAccountName?.trim() ||
      (status === "closed" && !closedDescription.trim()) ||
      getMissingPriceSelections(amenityPricing).length > 0 ||
      getMissingPriceSelections(activityPricing).length > 0 ||
      Object.keys(validationErrors).length > 0
    ) {
      setRoomErrors(validationErrors);
      alert("Please complete the required listing details before saving.");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("accommodationName", accommodation.accommodationName.trim());
      formData.append("accommodationType", accommodationType);
      formData.append("businessAddress", formatBusinessAddress(accommodation.businessAddress));
      formData.append("description", accommodation.description.trim());
      formData.append("gcashNumber", accommodation.gcashNumber);
      formData.append("gcashAccountName", accommodation.gcashAccountName.trim());
      formData.append("location", JSON.stringify(location));
      formData.append("amenities", JSON.stringify(getSelectedPricingKeys(amenityPricing)));
      formData.append("activities", JSON.stringify(getSelectedPricingKeys(activityPricing)));
      formData.append(
        "amenityPricing",
        JSON.stringify(getPricedSelectionsPayload(amenityPricing, AMENITIES_LIST))
      );
      formData.append(
        "activityPricing",
        JSON.stringify(getPricedSelectionsPayload(activityPricing, ACTIVITIES_LIST))
      );
      formData.append("status", status);
      formData.append("closedDescription", closedDescription.trim());
      formData.append("existingProfileImage", accommodation.profileImage || "");
      formData.append(
        "existingCoverImages",
        JSON.stringify(coverImages.filter((image) => image.existingPath).map((image) => image.existingPath))
      );

      const existingRoomImages = {};
      selectedRooms.forEach((room) => {
        existingRoomImages[room] = (roomImages[room] || [])
          .filter((image) => image.existingPath)
          .map((image) => image.existingPath);
      });
      formData.append("existingRoomImages", JSON.stringify(existingRoomImages));

      if (profileImage.file) {
        formData.append("profileImage", profileImage.file);
      }

      coverImages.forEach((image) => {
        if (image.file) {
          formData.append("coverImages", image.file);
        }
      });

      const roomPayload = {};
      selectedRooms.forEach((room) => {
        roomPayload[room] = roomData[room] || {};
      });
      formData.append("roomData", JSON.stringify(roomPayload));
      formData.append("selectedRooms", JSON.stringify(selectedRooms));

      selectedRooms.forEach((room) => {
        (roomImages[room] || []).forEach((image) => {
          if (image.file) {
            formData.append("roomImages", image.file);
            formData.append("roomImageNames", room);
          }
        });
      });

      const response = await fetch(`${API_URL}/accommodations/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json();
        alert(payload.message || "Update failed");
        setIsLoading(false);
        return;
      }

      const refreshed = await fetch(`${API_URL}/accommodations/${id}`).then((result) => result.json());
      applyAccommodationData(refreshed);
      setIsEditing(false);
      setShowSuccessModal(true);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert("Update failed");
    }
  };

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar active="accommodations" isHidden={sidebarHidden} setIsHidden={setSidebarHidden} />

      <main className="property-owner-main">
        <div className="edit-header-bar">
          <div className="edit-header-left">
            {sidebarHidden ? <MenuButton onClick={() => setSidebarHidden(false)} /> : null}
            <div>
              <h2 className="edit-page-title">{accommodation.accommodationName}</h2>
              <p className="edit-page-sub">
                {getAccommodationType(accommodation)} | {TRINIDAD_DESTINATION.fullLabel}
              </p>
            </div>
          </div>
          <div className="edit-header-actions">
            <button className="edit-back-btn" onClick={() => navigate("/property-owner/create-accommodation")}>
              Back
            </button>
            {!isEditing ? (
              <button className="edit-edit-btn" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            ) : null}
          </div>
        </div>

        <div className="edit-form-wrap">
          <div className="edit-section edit-section--hero">
            <div className="edit-section-title">
              <span className="edit-section-num">01</span> Listing Overview
            </div>
            <div className="edit-overview-header">
              <div className="acm-badge-row">
                <span className="acm-location-badge">Municipality: Trinidad</span>
                <span className="acm-location-badge">Province: Bohol</span>
                <span className="acm-location-badge">Country: Philippines</span>
              </div>
              <AccommodationStatusBadge status={status} className="edit-status-pill" />
            </div>

            <div className="edit-field">
              <label>Accommodation Name</label>
              <input type="text" name="accommodationName" value={accommodation.accommodationName} disabled={!isEditing} onChange={handleChange} />
            </div>

            <div className="edit-field">
              <label>Accommodation Type</label>
              {isEditing ? (
                <div className="acm-type-grid">
                  {ACCOMMODATION_TYPES.map((type) => (
                    <button key={type} type="button" className={`acm-type-btn ${accommodationType === type ? "acm-type-btn--active" : ""}`} onClick={() => setAccommodationType(type)}>
                      {type}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="edit-value">{accommodationType || "Not set"}</p>
              )}
            </div>

            <div className="edit-field">
              <label>Business Address</label>
              <input type="text" name="businessAddress" value={accommodation.businessAddress} disabled={!isEditing} onChange={handleChange} />
            </div>

            <div className="edit-field">
              <label>Description</label>
              <textarea rows="4" name="description" value={accommodation.description} disabled={!isEditing} onChange={handleChange} />
            </div>

            <div className="edit-field-row">
              <div className="edit-field">
                <label>Status</label>
                {isEditing ? (
                  <select className="edit-status-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                    {ACCOMMODATION_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <AccommodationStatusBadge status={status} className="edit-status-pill" />
                )}
              </div>
              <div className="edit-field">
                <label>GCash Number</label>
                <input type="text" name="gcashNumber" value={accommodation.gcashNumber} disabled={!isEditing} onChange={handleChange} />
              </div>
            </div>

            <div className="edit-field">
              <label>GCash Account Name</label>
              <input type="text" name="gcashAccountName" value={accommodation.gcashAccountName} disabled={!isEditing} onChange={handleChange} />
            </div>

            {status === "closed" ? (
              <div className="acm-alert-panel">
                <label className="acm-label">Closure Notice</label>
                <textarea rows="3" className="acm-textarea" disabled={!isEditing} value={closedDescription} onChange={(event) => setClosedDescription(event.target.value)} />
              </div>
            ) : null}
          </div>

          <div className="edit-section">
            <div className="edit-section-title">
              <span className="edit-section-num">02</span> Location
            </div>
            <p className="acm-map-hint">
              {isEditing
                ? "Click on the map to update your pin. Selection remains limited to Trinidad, Bohol."
                : "Saved location for this Trinidad, Bohol accommodation."}
            </p>
            <TrinidadLocationMap location={location} onSelect={setLocation} canSelect={isEditing} height={340} />
            {location ? (
              <div className="acm-map-status">
                <span>
                  Latitude: {location.lat} | Longitude: {location.lng}
                </span>
                {isEditing ? <button type="button" className="acm-ghost-btn" onClick={() => setLocation(null)}>Clear Pin</button> : null}
              </div>
            ) : (
              <p className="acm-location-empty">No location pinned</p>
            )}
          </div>

          <div className="edit-section">
            <div className="edit-section-title">
              <span className="edit-section-num">03</span> Amenities
            </div>
            <p className="acm-pricing-note">
              Every selected amenity keeps a dedicated stored price that can be reviewed and
              updated later.
            </p>
            <PricedFeatureMatrix
              options={AMENITIES_LIST}
              selected={amenityPricing}
              toggle={(key) =>
                setAmenityPricing((current) => togglePricedSelection(current, AMENITIES_LIST, key))
              }
              onPriceChange={(key, price) =>
                setAmenityPricing((current) => updatePricedSelectionPrice(current, key, price))
              }
              readOnly={!isEditing}
            />
          </div>

          <div className="edit-section">
            <div className="edit-section-title">
              <span className="edit-section-num">04</span> Activities and Experiences
            </div>
            <p className="acm-pricing-note">
              Activities and experiences also store their own manual rates, helping the listing
              stay complete for owners and admins.
            </p>
            <PricedFeatureMatrix
              options={ACTIVITIES_LIST}
              selected={activityPricing}
              toggle={(key) =>
                setActivityPricing((current) => togglePricedSelection(current, ACTIVITIES_LIST, key))
              }
              onPriceChange={(key, price) =>
                setActivityPricing((current) => updatePricedSelectionPrice(current, key, price))
              }
              readOnly={!isEditing}
            />
          </div>

          <div className="edit-section">
            <div className="edit-section-title">
              <span className="edit-section-num">05</span> Property Media
            </div>

            <div className="edit-field">
              <label>Profile Picture</label>
              {isEditing ? (
                <label className="edit-upload-btn">
                  Replace Profile Picture
                  <input type="file" hidden accept="image/*" onChange={handleProfileUpload} />
                </label>
              ) : null}
              {profileImage.preview ? (
                <div className="edit-profile-preview">
                  <img src={profileImage.preview} alt="Profile" />
                </div>
              ) : null}
            </div>

            <div className="edit-field">
              <label>Cover Images</label>
              {isEditing ? (
                <label className="edit-upload-btn">
                  Add Cover Images
                  <input type="file" hidden accept="image/*" multiple onChange={handleCoverUpload} />
                </label>
              ) : null}
              <div className="edit-cover-grid">
                {coverImages.map((image, index) => (
                  <div key={`cover-${index}`} className="edit-cover-thumb">
                    <img src={image.preview} alt={`Cover ${index + 1}`} />
                    {isEditing ? (
                      <button type="button" className="edit-remove-img" onClick={() => setCoverImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}>
                        x
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AccommodationRoomEditorSection
            errors={roomErrors}
            handleRoomImageChange={handleRoomImageChange}
            handleRoomInputChange={handleRoomInputChange}
            isEditing={isEditing}
            roomData={roomData}
            roomImages={roomImages}
            selectedRooms={selectedRooms}
            setRoomImages={setRoomImages}
            setSelectedRooms={setSelectedRooms}
          />

          {isEditing ? (
            <div className="edit-actions">
              <button type="button" className="edit-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="button" className="edit-save-btn" onClick={handleUpdate}>
                Save Changes
              </button>
            </div>
          ) : null}
        </div>
      </main>

      <LoadingModal show={isLoading} />

      {showSuccessModal ? (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-icon">OK</div>
            <h3>Updated Successfully</h3>
            <p>Your accommodation details have been saved.</p>
            <button onClick={() => setShowSuccessModal(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
