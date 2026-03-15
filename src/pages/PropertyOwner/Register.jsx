import "./Register.css";
import trinigoLogo from "../../assets/trinigo-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";

export default function PropertyOwnerRegister() {
  const [formData, setFormData] = useState({
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  accommodationName: "",
  propertyType: "",
  businessAddress: "",
  description: "",
  businessPermits: [],
});

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [permitPreviews, setPermitPreviews] = useState([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");


      const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "businessPermits" && files) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));

      setFormData(prev => ({
        ...prev,
        businessPermits: [...prev.businessPermits, ...newFiles]
      }));

      setPermitPreviews(prev => [...prev, ...newPreviews]);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

    const removePermit = (index) => {
    setFormData(prev => ({
      ...prev,
      businessPermits: prev.businessPermits.filter((_, i) => i !== index)
    }));
    setPermitPreviews(prev => prev.filter((_, i) => i !== index));

    // Clean up memory
    URL.revokeObjectURL(permitPreviews[index]);
  };

  const validatePassword = () => {
  let newErrors = {};

  const password = formData.password;

  if (!password) {
    newErrors.password = "Password is required";
  } else {
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least 1 uppercase letter";
    } else if (!/\d/.test(password)) {
      newErrors.password = "Password must contain at least 1 number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Password must contain at least 1 symbol";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const goToLogin = () => {
  navigate("/property-owner/login");
};

    const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validatePassword()) return;

  setIsLoading(true);

  const data = new FormData();

  const fullName = [
    formData.firstName,
    formData.middleName,
    formData.lastName,
  ].filter(Boolean).join(" ");

  data.append("fullName", fullName);
  data.append("email", formData.email);
  data.append("phone", formData.phone);
  data.append("password", formData.password);
  data.append("accommodationName", formData.accommodationName);
  data.append("propertyType", formData.propertyType);
  data.append("businessAddress", formData.businessAddress);
  data.append("description", formData.description);

  formData.businessPermits.forEach((file) => {
    data.append("businessPermits", file);
  });

  try {
    const res = await fetch(`${API_URL}/property-owner/register`, {
      method: "POST",
      body: data,
    });

    const result = await res.json();

    if (!res.ok) {
      setIsLoading(false);
      setModalMessage(result.message || "Invalid email address");
      setShowModal(true);
      return;
    }

    // ✅ SAVE DATA (unchanged)
    localStorage.setItem(
      "propertyOwnerName",
      [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(" ")
    );

    localStorage.setItem(
      "accommodationName",
      formData.accommodationName
    );
    localStorage.setItem(
      "propertyType",
      formData.propertyType
    );

    // ⏳ KEEP LOADING A BIT
setTimeout(() => {
  setIsLoading(false);

  // ✅ SUCCESS MESSAGE (NO OK BUTTON)
  setModalMessage("Registration submitted successfully ✅");
  setShowModal(true);

  // ➡️ AUTO REDIRECT
  setTimeout(() => {
    navigate("/property-owner/pending-approval", {
      state: {
        accommodationName: formData.accommodationName,
        propertyType: formData.propertyType,
        businessAddress: formData.businessAddress,
        registrationDate: new Date().toISOString().split("T")[0],
      },
    });
  }, 1500);

}, 1500);

  } catch (error) {
    console.error(error);
    setIsLoading(false);
    setModalMessage("Error submitting form");
    setShowModal(true);
  }
};

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <img src={trinigoLogo} className="register-logo" />

        <h2>Register Your Property with TriniGo</h2>
        <p className="sub-text">
          Complete the form below to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <h4>Owner Information</h4>

          <div className="row">
  <div className="field">
    <label>First Name</label>
    <input
      name="firstName"
      placeholder="Enter your first name"
      onChange={handleChange}
    />
  </div>

  <div className="field">
    <label>Middle Name</label>
    <input
      name="middleName"
      placeholder="Enter your middle name (optional)"
      onChange={handleChange}
    />
  </div>
</div>

<div className="row">
  <div className="field">
    <label>Last Name</label>
    <input
      name="lastName"
      placeholder="Enter your last name"
      onChange={handleChange}
    />
  </div>

  <div className="field">
    <label>Email Address</label>
    <input
      name="email"
      placeholder="Enter your email address"
      onChange={handleChange}
    />
  </div>
</div>

          <div className="row">
  <div className="field">
    <label>Phone Number</label>
    <input
      name="phone"
      placeholder="Enter your phone number"
      onChange={handleChange}
    />
  </div>

  <div className="field">
  <label>Password</label>

  <div className="admin-password-wrapper">
    <input
      name="password"
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      onChange={handleChange}
    />

    <span
      className="admin-eye-icon"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? (
        /* OPEN EYE */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        /* CLOSED EYE */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M10.7 5.1A9.1 9.1 0 0 1 12 5c6 0 10.5 7 10.5 7a18.5 18.5 0 0 1-4.3 4.9M6.2 6.2C3.5 8.4 1.5 12 1.5 12a18.5 18.5 0 0 0 10.5 7.5c1.4 0 2.8-.3 4-.8"
          />
        </svg>
      )}
    </span>
  </div>
  {errors.password && (
  <p className="error-text">{errors.password}</p>
)}
</div>
</div>

<div className="credentials-reminder">
  <strong>Reminder:</strong> Please save your <b>Email</b> and <b>Password</b>.
  You will use these credentials to log in to your account in the
  <b> Property Owner Login</b> page.
</div>

          <h4>Property Details</h4>

          <div className="row">
  <div className="field">
    <label>Property Name</label>
    <input
      name="accommodationName"
      placeholder="Enter your accommodation name"
      onChange={handleChange}
    />
  </div>

  <div className="field">
    <label>Property Type</label>
    <select
  name="propertyType"
  value={formData.propertyType}
  onChange={handleChange}
>
  <option value="" disabled>
    Select your property type
  </option>
  <option value="Apartment">Apartment</option>
  <option value="Hotel">Hotel</option>
  <option value="Resort">Resort</option>
  <option value="Guesthouse">Guesthouse</option>
</select>
  </div>
</div>

          <div className="field">
  <label>Property Location</label>
  <select
    name="businessAddress"
    value={formData.businessAddress}
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
</div>

          <div className="field">
  <label>Description</label>
  <textarea
    name="description"
    placeholder="Brief description of your accommodation..."
    onChange={handleChange}
  />
</div>

          <h4>Upload Business Documents</h4>

                    <label className="upload-box">
            Click to Upload Business Documents
            <input
              type="file"
              name="businessPermits"
              hidden
              multiple
              accept="image/*,.pdf"
              onChange={handleChange}
            />
          </label>

          {permitPreviews.length > 0 && (
            <div className="permits-grid">
              {permitPreviews.map((preview, index) => (
                <div key={index} className="permit-item">
                  <img src={preview} alt={`Document ${index + 1}`} />
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => removePermit(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="note">
            <strong>Note:</strong> Your application will be reviewed and approved within minutes to an hour
            as your documents will be reviewed by the Tourism Officer.
          </div>

          <div className="actions">
  <button type="submit">Submit Registration</button>
  <div className="login-section">
    <span className="login-text">Already registered?</span>
    <button type="button" onClick={goToLogin}>
  Log In
</button>
  </div>
</div>
        </form>
      </div>

      {/* ✅ MODALS */}
    <LoadingModal
      show={isLoading}
      text="Submitting registration..."
    />

    <MessageModal
  show={showModal}
  message={modalMessage}
  onClose={() => setShowModal(false)}
  showButton={false}
  autoClose={true}
  duration={1500}
/>
    </div>
  );
}