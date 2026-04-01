import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import MenuButton from "../../components/MenuButton";
import "./AddTouristSpot.css";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

export default function AddTouristSpot() {
const [isSidebarHidden, setIsSidebarHidden] = useState(false);

// ================================
// INITIAL FORM STATE (NEW)
// ================================
const initialFormState = {
  name: "",
  address: "",
  description: "",
  entranceFee: {
    age0to6: 0,
    age7to12: "",
    age13up: "",
  },
  profilePicture: null,
  coverImages: [],
};

const [formData, setFormData] = useState(initialFormState);
const [profilePreview, setProfilePreview] = useState(null);
const navigate = useNavigate();

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

  setFormData((prev) => ({
    ...prev,
    entranceFee: {
      ...prev.entranceFee,
      [name]: formattedValue,
    },
  }));

  setErrors((prev) => ({
    ...prev,
    entranceFee: "",
  }));
};

// ================================
// HANDLE INPUT CHANGE
// ================================
const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData({
    ...formData,
    [name]: value,
  });

  setErrors({
    ...errors,
    [name]: "",
  });
};

// ================================
// VALIDATION
// ================================
const validateForm = () => {
  let newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = "Tourist spot name is required";
  }

  if (!formData.address.trim()) {
    newErrors.address = "Tourist spot address is required";
  }

  if (!formData.description.trim()) {
    newErrors.description = "Description is required";
  }

  if (!formData.profilePicture) {
    newErrors.profilePicture = "Profile picture is required";
  }

  if (formData.coverImages.length === 0) {
    newErrors.coverImages = "At least one cover image is required";
  }

  if (!formData.entranceFee.age7to12) {
  newErrors.entranceFee = "7–12 years old fee is required";
}

if (!formData.entranceFee.age13up) {
  newErrors.entranceFee = "13+ years old fee is required";
}

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

// ================================
// HANDLE SUBMIT
// ================================
const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    const formPayload = new FormData();

    formPayload.append("name", formData.name);
    formPayload.append("address", formData.address);
    formPayload.append("description", formData.description);

    formPayload.append(
      "entranceFee",
      JSON.stringify(formData.entranceFee)
    );

    formPayload.append("profileImage", formData.profilePicture);

    formData.coverImages.forEach((img) => {
      formPayload.append("coverImages", img.file);
    });

    const response = await fetch(
  `${API_URL}/tourist-spots`,
      {
        method: "POST",
        body: formPayload,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    setSuccessMessage("Tourist Spot Added Successfully ✅");

  } catch (error) {
    console.error(error);
    alert("Failed to add tourist spot");
  }
};

// ================================  
// HANDLE DELETE (RESET FORM)  
// ================================  
const handleDelete = () => {  
  setFormData(initialFormState);  
  setProfilePreview(null);  
  setErrors({});  
  
  // Reset file inputs manually  
  const profileInput = document.getElementById("profileUpload");  
  if (profileInput) profileInput.value = "";  
  
  const coverInput = document.getElementById("coverUpload");  
  if (coverInput) coverInput.value = "";  
};

const [errors, setErrors] = useState({});
const [successMessage, setSuccessMessage] = useState(null);

// ================================
// HANDLE PROFILE PICTURE
// ================================
const handleProfileUpload = (e) => {
  const file = e.target.files[0];

  if (file) {
    setFormData({
      ...formData,
      profilePicture: file,
    });

    setProfilePreview(URL.createObjectURL(file));

    setErrors({
      ...errors,
      profilePicture: "",
    });
  }
};

// ================================
// HANDLE COVER IMAGES
// ================================
const handleCoverUpload = (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  setErrors({
    ...errors,
    coverImages: "",
  });

  files.forEach((file) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        coverImages: [
          ...prev.coverImages,
          {
            file,
            preview: reader.result,
          },
        ],
      }));
    };

    reader.readAsDataURL(file);
  });

  // reset input para pwede ulit mag-upload same file
  const input = document.getElementById("coverUpload");
  if (input) input.value = "";
};

  return (
    <div className="add-tourist-wrapper">
      <Sidebar
        active="tourist-spots"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      {isSidebarHidden && (
        <MenuButton onClick={() => setIsSidebarHidden(false)} />
      )}

      <main className="add-tourist-main">
        {/* HEADER */}
<div className="add-tourist-header">Add Tourist Spot</div>

{/* BACK ARROW */}
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
</div>
        {/* FORM CONTAINER */}
        <div className="add-tourist-card">
          <h2>Add Tourist Spot</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Tourist Spot Name</label>
              <input
  type="text"
  name="name"
  placeholder="Enter the official tourist spot name"
  value={formData.name}
  onChange={handleChange}
/>
{errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Tourist Spot Address</label>
<select
    name="address"
    value={formData.address}
    onChange={handleChange}
  >
    <option value="">Select Barangay</option>
    <option value="Banlasan">Banlasan</option>
    <option value="Bongbong">Bongbong</option>
    <option value="Catoogan">Catoogan</option>
    <option value="Guinobatan">Guinobatan</option>
    <option value="Hinlayagan Ilaud">Hinlayagan Ilaud</option>
    <option value="Hinlayagan Ilaya">Hinlayagan Ilaya</option>
    <option value="Kauswagan">Kauswagan</option>
    <option value="Kinan-oan">Kinan-oan</option>
    <option value="La Union">La Union</option>
    <option value="La Victoria">La Victoria</option>
    <option value="Mabuhay Cabiguhan">Mabuhay Cabiguhan</option>
    <option value="Mahagbu">Mahagbu</option>
    <option value="M. Roxas">M. Roxas</option>
    <option value="Poblacion">Poblacion</option>
    <option value="San Isidro">San Isidro</option>
    <option value="San Vicente">San Vicente</option>
    <option value="Santo Tomas">Santo Tomas</option>
    <option value="Soom">Soom</option>
    <option value="Tagum Norte">Tagum Norte</option>
    <option value="Tagum Sur">Tagum Sur</option>
  </select>
{errors.address && <span className="error-text">{errors.address}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
  rows="4"
  name="description"
  placeholder="Provide detailed description"
  value={formData.description}
  onChange={handleChange}
/>
{errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
  <label>Profile Picture</label>

  <button
    type="button"
    className="upload-btn"
    onClick={() => document.getElementById("profileUpload").click()}
  >
    Click to Upload Profile Picture
  </button>

  <input
    type="file"
    id="profileUpload"
    accept="image/*"
    style={{ display: "none" }}
    onChange={handleProfileUpload}
  />

  {errors.profilePicture && (
    <span className="error-text">{errors.profilePicture}</span>
  )}
  {profilePreview && (
  <div className="ts-image-preview">
    <img src={profilePreview} alt="Profile Preview" />

    <button
      type="button"
      className="ts-remove-img"
      onClick={() => {
        setFormData({
          ...formData,
          profilePicture: null,
        });

        setProfilePreview(null);

        const input = document.getElementById("profileUpload");
        if (input) input.value = "";
      }}
    >
      ×
    </button>
  </div>
)}
</div>

          <div className="form-group">
  <label>Cover Images</label>

  <button
    type="button"
    className="upload-btn"
    onClick={() => document.getElementById("coverUpload").click()}
  >
    Click to Upload Cover Images
  </button>

  <input
    type="file"
    id="coverUpload"
    accept="image/*"
    multiple
    style={{ display: "none" }}
    onChange={handleCoverUpload}
  />

  {formData.coverImages.length > 0 && (
  <div className="ts-more-preview">
    {formData.coverImages.map((img, index) => (
      <div key={index} className="ts-more-image-box">
        <img src={img.preview} alt={`cover-${index}`} />

        <button
          type="button"
          className="ts-remove-img"
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              coverImages: prev.coverImages.filter((_, i) => i !== index),
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

          <div className="form-group">
  <label>Entrance Fee</label>

  <div className="fee-grid">

    <div className="fee-item">
      <label>0–6 years old (Free)</label>
      <input
        type="number"
        name="age0to6"
        min="0"
        value={formData.entranceFee.age0to6}
        readOnly
      />
    </div>

    <div className="fee-item">
      <label>7–12 years old</label>
      <input
        type="text"
        name="age7to12"
        min="0"
        placeholder="Enter amount"
        value={formData.entranceFee.age7to12}
        onChange={handleFeeChange}
      />
    </div>

    <div className="fee-item">
      <label>13+ years old</label>
      <input
        type="text"
        name="age13up"
        min="0"
        placeholder="Enter amount"
        value={formData.entranceFee.age13up}
        onChange={handleFeeChange}
      />
    </div>

  </div>

  {errors.entranceFee && (
    <span className="error-text">{errors.entranceFee}</span>
  )}
</div>

          <div className="form-actions">
            <button 
  className="ok-btn" 
  type="button" 
  onClick={handleDelete}
>
  Clear
</button>
            <button className="ok-btn" onClick={handleSubmit}>
  OK
</button>
          </div>
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
              navigate("/admin/tourist-spots");
            }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
