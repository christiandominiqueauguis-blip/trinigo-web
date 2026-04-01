import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import MenuButton from "../../components/MenuButton";
import "./AddTouristSpot.css";
import { BASE_URL, API_URL } from "../../config/api";

export default function EditTouristSpot() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [touristSpot, setTouristSpot] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [newCoverImages, setNewCoverImages] = useState([]);
  const [originalTouristSpot, setOriginalTouristSpot] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ================================
  // FETCH TOURIST SPOT BY ID
  // ================================
  useEffect(() => {
    fetch(`${API_URL}/tourist-spots/${id}`)
      .then((res) => res.json())
      .then((data) => {
  setTouristSpot(data);
  setOriginalTouristSpot(data);
})
      .catch((err) => console.error(err));
  }, [id]);

  if (!touristSpot) return <div>Loading...</div>;

  // ================================
  // HANDLE CHANGE
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setTouristSpot({
      ...touristSpot,
      [name]: value,
    });
  };

// ================================
// FORMAT CURRENCY (NEW)
// ================================
const formatCurrency = (value) => {
  if (!value) return "";

  const numberValue = value.toString().replace(/[^\d]/g, "");

  if (!numberValue) return "";

  return "₱ " + Number(numberValue).toLocaleString("en-PH");
};

  const handleFeeChange = (e) => {
  const { name, value } = e.target;

  const formattedValue = formatCurrency(value);

  setTouristSpot({
    ...touristSpot,
    entranceFee: {
      ...touristSpot.entranceFee,
      [name]: formattedValue,
    },
  });
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

  const input = document.getElementById("editCoverUpload");
  if (input) input.value = "";
};

// ================================
// REMOVE NEW PROFILE IMAGE
// ================================
const removeNewProfileImage = () => {
  setNewProfileImage(null);
  setNewProfilePreview(null);

  const input = document.getElementById("editProfileUpload");
  if (input) input.value = "";
};

// ================================
// REMOVE NEW COVER IMAGE
// ================================
const removeNewCoverImage = (index) => {
  setNewCoverImages((prev) =>
    prev.filter((_, i) => i !== index)
  );
};

  // ================================
  // HANDLE UPDATE
  // ================================
  const handleUpdate = async () => {
  try {
    const formPayload = new FormData();

    formPayload.append("name", touristSpot.name);
    formPayload.append("address", touristSpot.address);
    formPayload.append("description", touristSpot.description);
    const cleanedEntranceFee = {
  ...touristSpot.entranceFee,
  age0to6: 0,
  age7to12: touristSpot.entranceFee.age7to12
    .replace(/[₱,\s]/g, ""),
  age13up: touristSpot.entranceFee.age13up
    .replace(/[₱,\s]/g, ""),
};

formPayload.append(
  "entranceFee",
  JSON.stringify(cleanedEntranceFee)
);

    // NEW PROFILE IMAGE
    if (newProfileImage) {
      formPayload.append("profileImage", newProfileImage);
    }

    // NEW COVER IMAGES
    newCoverImages.forEach((img) => {
      formPayload.append("coverImages", img.file);
    });

    const response = await fetch(
      `${API_URL}/tourist-spots/${id}`,
      {
        method: "PUT",
        body: formPayload,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    setSuccessMessage("Tourist Spot Updated Successfully ✅");

  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};

const handleCancel = () => {
  setTouristSpot(originalTouristSpot);
  setNewProfileImage(null);
  setNewProfilePreview(null);
  setNewCoverImages([]);
  setIsEditing(false);
};

  return (
    <div className="add-tourist-wrapper">
      <Sidebar
        active="tourist-spots"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      <main className="add-tourist-main">
        {isSidebarHidden ? (
          <MenuButton
            className="menu-button--floating"
            onClick={() => setIsSidebarHidden(false)}
          />
        ) : null}

        <div className="add-tourist-header">
          {touristSpot.name}
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
  <button
    className="add-tourist-back"
    onClick={() => navigate("/admin/tourist-spots")}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#116735"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  </button>

  <button
  className="tourist-add-btn"
  onClick={() => {
    setIsEditing(true);

    setTouristSpot((prev) => ({
      ...prev,
      entranceFee: {
        ...prev.entranceFee,
        age0to6: "Free",
      },
    }));
  }}
>
  Edit
</button>
</div>

        <div className="add-tourist-card">
          <h2>Manage Tourist Spot</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Tourist Spot Name</label>
              <input
                type="text"
                name="name"
                value={touristSpot.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Tourist Spot Address</label>
              <input
                type="text"
                name="address"
                value={touristSpot.address}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="4"
              name="description"
              value={touristSpot.description}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          {/* PROFILE IMAGE */}
<div className="form-group">
  <label>Profile Picture</label>

  {isEditing && (
    <>
      <button
        type="button"
        className="upload-btn"
        onClick={() => document.getElementById("editProfileUpload").click()}
      >
        Click to Upload Profile Picture
      </button>

      <input
        type="file"
        id="editProfileUpload"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleProfileUpload}
      />
    </>
  )}

  {/* NEW PREVIEW */}
  {newProfilePreview ? (
  <div className="ts-image-preview">
    <img src={newProfilePreview} alt="preview" />

    {isEditing && (
      <button
        type="button"
        className="ts-remove-img"
        onClick={removeNewProfileImage}
      >
        ×
      </button>
    )}
  </div>
) : (
    touristSpot.profileImage && (
  <div className="ts-image-preview">
    <img
      src={`${BASE_URL}${touristSpot.profileImage}`}
      alt="profile"
    />

    {isEditing && (
      <button
        type="button"
        className="ts-remove-img"
        onClick={() =>
          setTouristSpot({
            ...touristSpot,
            profileImage: null,
          })
        }
      >
        ×
      </button>
    )}
  </div>
)
  )}
</div>

          {/* COVER IMAGES */}
<div className="form-group">
  <label>Cover Images</label>

  {isEditing && (
    <>
      <button
        type="button"
        className="upload-btn"
        onClick={() => document.getElementById("editCoverUpload").click()}
      >
        Click to Upload Cover Images
      </button>

      <input
        type="file"
        id="editCoverUpload"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleCoverUpload}
      />
    </>
  )}

  <div className="ts-more-preview">

    {/* NEW IMAGES */}
    {newCoverImages.length > 0
  ? newCoverImages.map((img, index) => (
      <div key={index} className="ts-more-image-box">
        <img src={img.preview} alt="cover" />

        {isEditing && (
          <button
            type="button"
            className="ts-remove-img"
            onClick={() => removeNewCoverImage(index)}
          >
            ×
          </button>
        )}
      </div>
        ))
      : (touristSpot.coverImages || []).map((img, index) => (
    <div key={index} className="ts-more-image-box">
      <img
        src={`${BASE_URL}${img}`}
        alt="cover"
      />

      {isEditing && (
        <button
          type="button"
          className="ts-remove-img"
          onClick={() => {
            const updatedImages =
              touristSpot.coverImages.filter(
                (_, i) => i !== index
              );

            setTouristSpot({
              ...touristSpot,
              coverImages: updatedImages,
            });
          }}
        >
          ×
        </button>
      )}
    </div>
))
    }

  </div>
</div>

          {/* ENTRANCE FEE */}
          <div className="form-group">
            <label>Entrance Fee</label>

            <div className="fee-grid">
              <div className="fee-item">
                <label>0–6 years old</label>
                <input
  type="text"
  value={touristSpot.entranceFee.age0to6}
  readOnly
/>
              </div>

              <div className="fee-item">
                <label>7–12 years old</label>
                <input
                  type="text"
                  name="age7to12"
                  value={touristSpot.entranceFee.age7to12}
                  onChange={handleFeeChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="fee-item">
                <label>13+ years old</label>
                <input
                  type="text"
                  name="age13up"
                  value={touristSpot.entranceFee.age13up}
                  onChange={handleFeeChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {isEditing && (
  <div className="form-actions">

    <button
      className="cancel-btn"
      type="button"
      onClick={handleCancel}
    >
      Cancel
    </button>

    <button
      className="ok-btn"
      type="button"
      onClick={handleUpdate}
    >
      OK
    </button>

  </div>
)}
        </div>
      </main>

      {/* ======================== */}
      {/* SUCCESS MESSAGE MODAL */}
      {/* ======================== */}
      {successMessage && (
        <div className="admin-modal-overlay">
          <div className="system-message-modal">
            <p>{successMessage}</p>
            <button onClick={() => {
              setSuccessMessage(null);
              setIsEditing(false);
              window.location.reload();
            }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
