import "./CreateAccommodation.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal";
import MenuButton from "../../components/MenuButton";
import { BASE_URL, API_URL } from "../../config/api";

// ─── Room Form (same as SelectRoomType) ───────────────────────────────────────
function RoomForm({
  roomName,
  maxOptions,
  selectedRooms,
  handleRoomImageChange,
  roomImages,
  fileInputRefs,
  setRoomImages,
  formRef,
  roomData,
  errors,
  handleRoomInputChange,
}) {
  if (!selectedRooms.includes(roomName)) return null;

  return (
    <div className="po-room-form slide-down" ref={formRef}>
      <h3>{roomName}</h3>

      <div className="po-room-inputs">
        <div>
          <label>Room Price (₱)</label>
          <input
            type="number"
            value={roomData?.[roomName]?.price || ""}
            onChange={(e) =>
              handleRoomInputChange(roomName, "price", e.target.value)
            }
          />
          {errors?.[roomName]?.price && (
            <small className="po-error">{errors[roomName].price}</small>
          )}
        </div>

        <div>
          <label>Available Room</label>
          <input
            type="number"
            value={roomData?.[roomName]?.availableRooms || ""}
            onChange={(e) =>
              handleRoomInputChange(roomName, "availableRooms", e.target.value)
            }
          />
          {errors?.[roomName]?.availableRooms && (
            <small className="po-error">{errors[roomName].availableRooms}</small>
          )}
        </div>

        <div>
          <label>Max Persons</label>
          <select
            value={roomData?.[roomName]?.maxPersons || ""}
            onChange={(e) =>
              handleRoomInputChange(roomName, "maxPersons", e.target.value)
            }
          >
            <option value="">Select</option>
            {maxOptions.map((num) => (
              <option key={num}>{num}</option>
            ))}
          </select>
          {errors?.[roomName]?.maxPersons && (
            <small className="po-error">{errors[roomName].maxPersons}</small>
          )}
        </div>
      </div>

      <label>Upload Room Image</label>

      <label className="po-upload-btn">
        Click to Upload Room Image
        <input
          type="file"
          hidden
          accept="image/*"
          multiple
          onChange={(e) => handleRoomImageChange(roomName, e)}
          ref={(el) => (fileInputRefs.current[roomName] = el)}
        />
      </label>

      {errors?.[roomName]?.image && (
        <small className="po-error">{errors[roomName].image}</small>
      )}

      {roomImages[roomName] && roomImages[roomName].length > 0 && (
        <div className="po-more-preview">
          {roomImages[roomName].map((img, index) => (
            <div key={index} className="po-more-image-box">
              <img
                src={img.preview || `${BASE_URL}${img}`}
                alt={`${roomName}-${index}`}
              />
              <button
                type="button"
                className="po-remove-img"
                onClick={() => {
                  setRoomImages((prev) => ({
                    ...prev,
                    [roomName]: prev[roomName].filter((_, i) => i !== index),
                  }));
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditAccommodation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Accommodation form state
  const [accommodation, setAccommodation] = useState(null);
  const [original, setOriginal] = useState(null);

  const [newProfileImage, setNewProfileImage] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [newCoverImages, setNewCoverImages] = useState([]);

  // Room state
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomData, setRoomData] = useState({});
  const [roomImages, setRoomImages] = useState({});
  const [roomErrors, setRoomErrors] = useState({});
  const fileInputRefs = useRef({});
  const formScrollRef = useRef(null);

  const ROOM_TYPES = [
    "Single Room",
    "Double Room",
    "Deluxe Room",
    "Family Room",
    "Dormitory Room",
    "Double Deluxe Room",
  ];

  // ── Fetch accommodation ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/accommodations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setAccommodation(data);
        setOriginal(data);

        // Populate room state from existing rooms
        const existingSelected = data.rooms.map((r) => r.roomName);
        setSelectedRooms(existingSelected);

        const existingRoomData = {};
        const existingRoomImages = {};
        data.rooms.forEach((r) => {
          existingRoomData[r.roomName] = {
            price: r.price,
            availableRooms: r.availableRooms,
            maxPersons: String(r.maxPersons),
          };
          // Store existing image paths as objects with a preview key
          existingRoomImages[r.roomName] = r.images.map((imgPath) => ({
            preview: `${BASE_URL}${imgPath}`,
            existingPath: imgPath,
          }));
        });
        setRoomData(existingRoomData);
        setRoomImages(existingRoomImages);
      })
      .catch((err) => console.error(err));
  }, [id]);

  if (!accommodation) return <div>Loading...</div>;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAccommodation((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewProfileImage(file);
    setNewProfilePreview(URL.createObjectURL(file));
  };

  const handleCoverUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const mapped = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewCoverImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const handleRoomToggle = (room) => {
    setSelectedRooms((prev) =>
      prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]
    );
  };

  const handleRoomInputChange = (room, field, value) => {
    setRoomData((prev) => ({
      ...prev,
      [room]: { ...prev[room], [field]: value },
    }));
    setRoomErrors((prev) => ({
      ...prev,
      [room]: { ...prev[room], [field]: "" },
    }));
  };

  const handleRoomImageChange = (room, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomImages((prev) => ({
          ...prev,
          [room]: [
            ...(prev[room] || []),
            { file, preview: reader.result, base64: reader.result },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
    setRoomErrors((prev) => ({
      ...prev,
      [room]: { ...prev[room], image: "" },
    }));
  };

  const handleCancel = () => {
    setAccommodation(original);
    setNewProfileImage(null);
    setNewProfilePreview(null);
    setNewCoverImages([]);
    // Reset rooms to original
    const existingSelected = original.rooms.map((r) => r.roomName);
    setSelectedRooms(existingSelected);
    const existingRoomData = {};
    const existingRoomImages = {};
    original.rooms.forEach((r) => {
      existingRoomData[r.roomName] = {
        price: r.price,
        availableRooms: r.availableRooms,
        maxPersons: String(r.maxPersons),
      };
      existingRoomImages[r.roomName] = r.images.map((imgPath) => ({
        preview: `${BASE_URL}${imgPath}`,
        existingPath: imgPath,
      }));
    });
    setRoomData(existingRoomData);
    setRoomImages(existingRoomImages);
    setRoomErrors({});
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();

      formData.append("accommodationName", accommodation.accommodationName);
      formData.append("businessAddress", accommodation.businessAddress);
      formData.append("description", accommodation.description);
      formData.append("gcashNumber", accommodation.gcashNumber);
      formData.append("gcashAccountName", accommodation.gcashAccountName);

      if (newProfileImage) {
        formData.append("profileImage", newProfileImage);
      }

      newCoverImages.forEach((img) => {
        formData.append("coverImages", img.file);
      });

      // Room data
      const roomDataPayload = {};
      selectedRooms.forEach((room) => {
        roomDataPayload[room] = roomData[room] || {};
      });
      formData.append("roomData", JSON.stringify(roomDataPayload));
      formData.append("selectedRooms", JSON.stringify(selectedRooms));

      // New room images only (files)
      selectedRooms.forEach((room) => {
        const imgs = roomImages[room] || [];
        imgs.forEach((imgObj) => {
          if (imgObj.file) {
            formData.append("roomImages", imgObj.file);
            formData.append("roomImageNames", room);
          }
        });
      });

      const res = await fetch(`${API_URL}/accommodations/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setIsEditing(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar active="accommodations" isHidden={sidebarHidden} />

      <main
        className="property-owner-main"
        onClick={() => setSidebarHidden(true)}
      >
        {/* Header */}
        <div className="po-accommodation-header">
          {accommodation.accommodationName}
          {sidebarHidden && (
            <MenuButton
              onClick={(e) => {
                e.stopPropagation();
                setSidebarHidden(false);
              }}
            />
          )}
        </div>

        {/* Back + Edit buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            className="po-back-btn"
            onClick={() => navigate("/property-owner/create-accommodation")}
          >
            ←
          </button>
          <button
            className="po-next-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            Edit
          </button>
        </div>

        {/* ── ACCOMMODATION FORM CARD ── */}
        <div className="po-accommodation-card">
          <h3>Accommodation Details</h3>
          <p className="po-subtitle">View and edit your accommodation information.</p>

          <label>Accommodation Name</label>
          <input
            type="text"
            name="accommodationName"
            value={accommodation.accommodationName}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <label>Business Address</label>
          <input
            type="text"
            name="businessAddress"
            value={accommodation.businessAddress}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <label>Description</label>
          <textarea
            rows="4"
            name="description"
            value={accommodation.description}
            onChange={handleChange}
            disabled={!isEditing}
          />

          {/* Profile Picture */}
          <label>Profile Picture</label>
          {isEditing && (
            <>
              <label className="po-upload-btn">
                Click to Upload Profile Picture
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleProfileUpload}
                />
              </label>
            </>
          )}
          {newProfilePreview ? (
            <div className="po-image-preview">
              <img src={newProfilePreview} alt="New Profile" />
              {isEditing && (
                <button
                  type="button"
                  className="po-remove-img"
                  onClick={() => {
                    setNewProfileImage(null);
                    setNewProfilePreview(null);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            accommodation.profileImage && (
              <div className="po-image-preview">
                <img
                  src={`${BASE_URL}${accommodation.profileImage}`}
                  alt="Profile"
                />
              </div>
            )
          )}

          {/* Cover Images */}
          <label>Cover Images</label>
          {isEditing && (
            <label className="po-upload-btn">
              Click to Upload Cover Images
              <input
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={handleCoverUpload}
              />
            </label>
          )}
          <div className="po-more-preview">
            {newCoverImages.length > 0
              ? newCoverImages.map((img, index) => (
                  <div key={index} className="po-more-image-box">
                    <img src={img.preview} alt="cover" />
                    {isEditing && (
                      <button
                        type="button"
                        className="po-remove-img"
                        onClick={() =>
                          setNewCoverImages((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              : (accommodation.coverImages || []).map((img, index) => (
                  <div key={index} className="po-more-image-box">
                    <img src={`${BASE_URL}${img}`} alt="cover" />
                  </div>
                ))}
          </div>

          <hr className="po-divider" />

          {/* GCash */}
          <label>GCash Number</label>
          <input
            type="text"
            name="gcashNumber"
            value={accommodation.gcashNumber}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <label>GCash Account Name</label>
          <input
            type="text"
            name="gcashAccountName"
            value={accommodation.gcashAccountName}
            onChange={handleChange}
            disabled={!isEditing}
          />

          {/* Cancel / OK */}
          {isEditing && (
            <div className="po-actions">
              <button
                type="button"
                className="po-delete-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="po-next-btn"
                onClick={handleUpdate}
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* ── SELECT ROOM TYPE CARD ── */}
        <div className="po-room-card" style={{ marginTop: "25px" }}>
          <h3>Manage Room Types</h3>
          <p className="po-subtitle">
            Define and configure the different room types available at your property.
          </p>
          <div className="po-room-checkboxes">
            {ROOM_TYPES.map((room) => (
              <label key={room}>
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={() => isEditing && handleRoomToggle(room)}
                  disabled={!isEditing}
                />
                {room}
              </label>
            ))}
          </div>
        </div>

        <div className="po-room-forms-scroll">
          {ROOM_TYPES.map((room) => (
            <RoomForm
              key={room}
              roomName={room}
              maxOptions={[1,2,3,4,5,6,7,8,9,10]}
              selectedRooms={selectedRooms}
              handleRoomImageChange={handleRoomImageChange}
              roomImages={roomImages}
              fileInputRefs={fileInputRefs}
              setRoomImages={setRoomImages}
              formRef={formScrollRef}
              roomData={roomData}
              errors={roomErrors}
              handleRoomInputChange={handleRoomInputChange}
            />
          ))}
        </div>

      </main>

      <LoadingModal show={isLoading} />

      {showSuccessModal && (
        <div className="admin-modal-overlay">
          <div className="system-message-modal">
            <p>Accommodation updated successfully ✅</p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                window.location.reload();
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}