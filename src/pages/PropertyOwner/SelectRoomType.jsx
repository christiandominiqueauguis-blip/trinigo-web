import "./CreateAccommodation.css";
import "./SelectRoomType.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal";
import MenuButton from "../../components/MenuButton";
import { API_URL } from "../../config/api";
import AccommodationStatusBadge from "../../features/accommodations/AccommodationStatusBadge";
import {
  ACTIVITIES_LIST,
  AMENITIES_LIST,
  buildPricedSelections,
  MAX_PERSONS_OPTIONS,
  ROOM_TYPES,
  TRINIDAD_DESTINATION,
  clearAccommodationDraft,
  getMissingPriceSelections,
  getPricedSelectionsPayload,
  getSelectedPricingKeys,
  getStatusMeta,
  readAccommodationDraft,
  saveAccommodationRoomDraft,
} from "../../features/accommodations/accommodationHelpers";

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, addToast };
}

function ToastStack({ toasts }) {
  return (
    <div className="srt-toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`srt-toast srt-toast--${t.type}`}>
          {t.type === "error" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
            </svg>
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function RoomForm({ roomName, selectedRooms, roomData, roomImages, errors, fileInputRefs, setRoomImages, handleRoomInputChange }) {
  if (!selectedRooms.includes(roomName)) return null;

  return (
    <div className="srt-room-form slide-down">
      <div className="srt-room-form-title">
        <span className="srt-room-badge">{roomName}</span>
      </div>

      <div className="srt-room-inputs">
        <div className="srt-field">
          <label className="srt-label">Price per Night (₱) <span className="srt-req">*</span></label>
          <input
            className={`srt-input ${errors?.[roomName]?.price ? "srt-input--err" : ""}`}
            type="number"
            min="0"
            placeholder="0.00"
            value={roomData?.[roomName]?.price || ""}
            onChange={(e) => handleRoomInputChange(roomName, "price", e.target.value)}
          />
          {errors?.[roomName]?.price && <small className="srt-err-msg">{errors[roomName].price}</small>}
        </div>

        <div className="srt-field">
          <label className="srt-label">Available Rooms <span className="srt-req">*</span></label>
          <input
            className={`srt-input ${errors?.[roomName]?.availableRooms ? "srt-input--err" : ""}`}
            type="number"
            min="1"
            placeholder="1"
            value={roomData?.[roomName]?.availableRooms || ""}
            onChange={(e) => handleRoomInputChange(roomName, "availableRooms", e.target.value)}
          />
          {errors?.[roomName]?.availableRooms && <small className="srt-err-msg">{errors[roomName].availableRooms}</small>}
        </div>

        <div className="srt-field">
          <label className="srt-label">Max Persons <span className="srt-req">*</span></label>
          <select
            className={`srt-input ${errors?.[roomName]?.maxPersons ? "srt-input--err" : ""}`}
            value={roomData?.[roomName]?.maxPersons || ""}
            onChange={(e) => handleRoomInputChange(roomName, "maxPersons", e.target.value)}
          >
            <option value="">Select</option>
            {MAX_PERSONS_OPTIONS.map((n) => <option key={n}>{n}</option>)}
          </select>
          {errors?.[roomName]?.maxPersons && <small className="srt-err-msg">{errors[roomName].maxPersons}</small>}
        </div>
      </div>

      {/* Room images */}
      <div className="srt-field" style={{ marginTop: 4 }}>
        <label className="srt-label">Room Images <span className="srt-req">*</span></label>
        <label className="srt-upload-zone">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Upload room images</span>
          <small>Multiple allowed</small>
          <input
            type="file"
            hidden
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (!files.length) return;
              files.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () =>
                  setRoomImages((prev) => ({
                    ...prev,
                    [roomName]: [...(prev[roomName] || []), { file, preview: reader.result, base64: reader.result }],
                  }));
                reader.readAsDataURL(file);
              });
            }}
            ref={(el) => (fileInputRefs.current[roomName] = el)}
          />
        </label>
        {errors?.[roomName]?.image && <small className="srt-err-msg">{errors[roomName].image}</small>}

        {roomImages[roomName]?.length > 0 && (
          <div className="srt-img-grid">
            {roomImages[roomName].map((img, i) => (
              <div key={i} className="srt-img-thumb">
                <img src={img.preview} alt={`${roomName}-${i}`} />
                <button
                  type="button"
                  className="srt-remove-btn"
                  onClick={() =>
                    setRoomImages((prev) => ({
                      ...prev,
                      [roomName]: prev[roomName].filter((_, idx) => idx !== i),
                    }))
                  }
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SelectRoomType() {
  const navigate = useNavigate();
  const fileInputRefs  = useRef({});
  const { toasts, addToast } = useToast();

  const [createData, setCreateData] = useState(null);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomData,   setRoomData]   = useState({});
  const [roomImages, setRoomImages] = useState({});
  const [errors,     setErrors]     = useState({});
  const [isLoading,  setIsLoading]  = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  /* restore session data */
  useEffect(() => {
    const draft = readAccommodationDraft();
    setCreateData(draft.listing);
    setRoomData(draft.roomData || {});
    setRoomImages(draft.roomImages || {});
    setSelectedRooms(draft.selectedRooms || []);

    if (!draft.listing) {
      addToast("Accommodation details were not found. Please complete step 1 first.", "error");
      setTimeout(() => navigate("/property-owner/create-accommodation"), 1200);
    }
  }, [addToast, navigate]);

  useEffect(() => {
    if (!createData) return;
    saveAccommodationRoomDraft({ roomData, roomImages, selectedRooms });
  }, [createData, roomData, roomImages, selectedRooms]);

  const handleRoomToggle = (room) =>
    setSelectedRooms((prev) =>
      prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]
    );

  const handleRoomInputChange = (room, field, value) => {
    setRoomData((prev) => ({ ...prev, [room]: { ...prev[room], [field]: value } }));
    setErrors((prev) => ({ ...prev, [room]: { ...prev[room], [field]: "" } }));
  };

  const selectedRoomCount = selectedRooms.length;
  const hasSelectedRooms = selectedRoomCount > 0;

  /* ── Submit ── */
  const handleOK = async () => {
    if (!createData) {
      addToast("Accommodation details are missing. Please go back to step 1.", "error");
      return;
    }

    let newErrors = {};
    selectedRooms.forEach((room) => {
      if (!roomData?.[room]?.price || Number(roomData[room].price) <= 0) {
        newErrors[room] = { ...newErrors[room], price: "Room price must be greater than zero" };
      }
      if (!roomData?.[room]?.availableRooms || Number(roomData[room].availableRooms) <= 0) {
        newErrors[room] = { ...newErrors[room], availableRooms: "Available rooms must be greater than zero" };
      }
      if (!roomData?.[room]?.maxPersons || Number(roomData[room].maxPersons) <= 0) {
        newErrors[room] = { ...newErrors[room], maxPersons: "Max persons is required" };
      }
      if (!roomImages[room]?.length) {
        newErrors[room] = { ...newErrors[room], image: "Please upload at least one room image" };
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const msgs = [...new Set(Object.values(newErrors).flatMap((e) => Object.values(e)))];
      msgs.slice(0, 4).forEach((msg, i) => setTimeout(() => addToast(msg, "error"), i * 120));
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("accommodationName",  createData.accommodationName);
      formData.append("accommodationType",  createData.accommodationType || "");
      formData.append("businessAddress",    createData.businessAddress);
      formData.append("description",        createData.description);
      formData.append("gcashNumber",        createData.gcashNumber);
      formData.append("gcashAccountName",   createData.gcashAccountName);
      formData.append("status",             createData.status || "open");
      formData.append("closedDescription",  createData.closedDescription || "");
      formData.append("ownerId",            localStorage.getItem("ownerId") || "");
      formData.append("location",           JSON.stringify(createData.location || { lat: null, lng: null }));
      const amenityPricing = buildPricedSelections(
        AMENITIES_LIST,
        createData.amenityPricing,
        createData.amenities
      );
      const activityPricing = buildPricedSelections(
        ACTIVITIES_LIST,
        createData.activityPricing,
        createData.activities
      );

      if (
        getMissingPriceSelections(amenityPricing).length ||
        getMissingPriceSelections(activityPricing).length
      ) {
        setIsLoading(false);
        addToast("Complete the amenity and activity prices in listing details before saving.", "error");
        setTimeout(() => navigate("/property-owner/create-accommodation"), 1200);
        return;
      }

      formData.append("amenities",          JSON.stringify(getSelectedPricingKeys(amenityPricing)));
      formData.append("activities",         JSON.stringify(getSelectedPricingKeys(activityPricing)));
      formData.append("amenityPricing",     JSON.stringify(getPricedSelectionsPayload(amenityPricing, AMENITIES_LIST)));
      formData.append("activityPricing",    JSON.stringify(getPricedSelectionsPayload(activityPricing, ACTIVITIES_LIST)));

      /* profile image */
      if (createData.profileImageBase64) {
        const arr = createData.profileImageBase64.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        const u8 = new Uint8Array(bstr.length);
        for (let n = bstr.length - 1; n >= 0; n--) u8[n] = bstr.charCodeAt(n);
        formData.append("profileImage", new File([u8], "profile.jpg", { type: mime }));
      }

      formData.append("roomData",      JSON.stringify(roomData));
      formData.append("selectedRooms", JSON.stringify(selectedRooms));

      /* cover images */
      const storedCovers = readAccommodationDraft().coverImages || [];
      storedCovers.forEach((imgObj, i) => {
        const arr = imgObj.base64.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        const u8 = new Uint8Array(bstr.length);
        for (let n = bstr.length - 1; n >= 0; n--) u8[n] = bstr.charCodeAt(n);
        formData.append("coverImages", new File([u8], `cover-${i}.jpg`, { type: mime }));
      });

      /* room images */
      selectedRooms.forEach((room) => {
        (roomImages[room] || []).forEach((imgObj, i) => {
          const arr = imgObj.base64.split(",");
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          const u8 = new Uint8Array(bstr.length);
          for (let n = bstr.length - 1; n >= 0; n--) u8[n] = bstr.charCodeAt(n);
          formData.append("roomImages", new File([u8], `room-${room}-${i}.jpg`, { type: mime }));
          formData.append("roomImageNames", room);
        });
      });

      const res = await fetch(`${API_URL}/accommodations`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setIsLoading(false);
        addToast(data.message || "Failed to save accommodation", "error");
        return;
      }

      /* clean up */
      clearAccommodationDraft();

      addToast("Accommodation saved successfully!", "success");
      setTimeout(() => navigate("/property-owner/create-accommodation"), 1800);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      addToast("Server error. Please try again.", "error");
    }
  };

  const handleBack = () => {
    saveAccommodationRoomDraft({ roomData, roomImages, selectedRooms });
    navigate("/property-owner/create-accommodation");
  };

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="accommodations"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main">

        {/* ── Page header ── */}
        <div className="srt-page-header">
          <div className="srt-header-left">
            {sidebarHidden && (
              <MenuButton onClick={(e) => { e.stopPropagation(); setSidebarHidden(false); }} />
            )}
            <div>
              <h2 className="srt-page-title">Select Room Types</h2>
              <p className="srt-page-sub">Define the room types available at your property</p>
            </div>
          </div>
          <button className="srt-back-btn" onClick={handleBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
        </div>

        <div className="srt-layout">
          {createData && (
            <div className="srt-summary-card">
              <div className="srt-summary-header">
                <div>
                  <span className="srt-summary-kicker">Listing Summary</span>
                  <h3>{createData.accommodationName}</h3>
                  <p>
                    {createData.accommodationType || "Accommodation"} in{" "}
                    {TRINIDAD_DESTINATION.fullLabel}
                  </p>
                </div>
                <AccommodationStatusBadge status={createData.status || "open"} />
              </div>

              <div className="srt-summary-grid">
                <div>
                  <span>Business Address</span>
                  <strong>{createData.businessAddress}</strong>
                </div>
                <div>
                  <span>Payment Profile</span>
                  <strong>{createData.gcashAccountName}</strong>
                </div>
                <div>
                  <span>Status Detail</span>
                  <strong>{getStatusMeta(createData.status || "open").caption}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ── Room type selector card ── */}
          <div className="srt-selector-card">
            <div className="srt-section-topline">
              <div>
                <h3 className="srt-section-title">Room Types and Inventory</h3>
                <p className="srt-selector-hint">
                  Room setup is optional. You can publish the accommodation now and add room types
                  later, or select room types below if you want to configure inventory right away.
                </p>
              </div>
              <span className={`srt-optional-pill ${hasSelectedRooms ? "srt-optional-pill--active" : ""}`}>
                {hasSelectedRooms ? `${selectedRoomCount} selected` : "Optional"}
              </span>
            </div>
            <p className="srt-selector-hint">
              Select all room types your property offers. Only the room types you choose will need
              price, capacity, and image details.
            </p>
            <div className="srt-chips">
              {ROOM_TYPES.map((room) => {
                const selected = selectedRooms.includes(room);
                return (
                  <button
                    key={room}
                    type="button"
                    className={`srt-chip ${selected ? "srt-chip--active" : ""}`}
                    onClick={() => handleRoomToggle(room)}
                  >
                    {selected && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {room}
                  </button>
                );
              })}
            </div>
            {hasSelectedRooms ? (
              <p className="srt-selected-count">
                {selectedRoomCount} room type{selectedRoomCount > 1 ? "s" : ""} selected
              </p>
            ) : (
              <p className="srt-empty-note">
                No room types selected yet. The accommodation will still be saved, and you can add
                rooms later from Manage Listing.
              </p>
            )}
          </div>

          {/* ── Room forms ── */}
          {selectedRooms.length > 0 && (
            <div className="srt-forms">
              {ROOM_TYPES.map((room) => (
                <RoomForm
                  key={room}
                  roomName={room}
                  selectedRooms={selectedRooms}
                  roomData={roomData}
                  roomImages={roomImages}
                  errors={errors}
                  fileInputRefs={fileInputRefs}
                  setRoomImages={setRoomImages}
                  handleRoomInputChange={handleRoomInputChange}
                />
              ))}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="srt-actions">
            <button type="button" className="srt-cancel-btn" onClick={handleBack}>
              Back
            </button>
            <button type="button" className="srt-submit-btn" onClick={handleOK}>
              {hasSelectedRooms ? "Save Accommodation" : "Save Without Room Types"}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            </button>
          </div>

        </div>
      </main>

      <ToastStack toasts={toasts} />
      <LoadingModal show={isLoading} />
    </div>
  );
}
