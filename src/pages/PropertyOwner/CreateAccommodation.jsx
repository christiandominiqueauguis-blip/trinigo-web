import "./CreateAccommodation.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal";
import MenuButton from "../../components/MenuButton";
import { BASE_URL, API_URL } from "../../config/api";

export default function CreateAccommodation() {
  const [propertyName, setPropertyName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [accommodationName, setAccommodationName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState({});
  const [roomImages, setRoomImages] = useState({});
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coverImages, setCoverImages] = useState([]);
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashAccountName, setGcashAccountName] = useState("");
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // tab state — default is "list"
  const [activeTab, setActiveTab] = useState("list");

  // NEW: accommodations list state
  const [accommodations, setAccommodations] = useState([]);

  const handleDeleteAll = () => {
    setAccommodationName("");
    setBusinessAddress("");
    setDescription("");
    setProfileImage(null);
    setProfilePreview(null);
    setGcashNumber("");
    setGcashAccountName("");

    localStorage.removeItem("createAccommodationData");
    localStorage.removeItem("roomData");
    localStorage.removeItem("roomImages");
    localStorage.removeItem("selectedRooms");
    setCoverImages([]);
    localStorage.removeItem("coverImages");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem("accommodationName");
    if (storedName) setPropertyName(storedName);

    const storedRoomData = localStorage.getItem("roomData");
    const storedRoomImages = localStorage.getItem("roomImages");
    const storedSelectedRooms = localStorage.getItem("selectedRooms");
    const storedCoverImages = localStorage.getItem("coverImages");
    if (storedCoverImages) {
      setCoverImages(JSON.parse(storedCoverImages));
    }

    if (storedRoomData) setRoomData(JSON.parse(storedRoomData));
    if (storedRoomImages) setRoomImages(JSON.parse(storedRoomImages));
    if (storedSelectedRooms) setSelectedRooms(JSON.parse(storedSelectedRooms));

    const storedCreateData = localStorage.getItem("createAccommodationData");
    if (storedCreateData) {
      const parsed = JSON.parse(storedCreateData);

      setAccommodationName(parsed.accommodationName || "");
      setBusinessAddress(parsed.businessAddress || "");
      setDescription(parsed.description || "");
      setGcashNumber(parsed.gcashNumber || "");
      setGcashAccountName(parsed.gcashAccountName || "");

      if (parsed.profileImageBase64) {
        setProfilePreview(parsed.profileImageBase64);
      }

      setErrors((prev) => ({ ...prev, coverImage: "" }));
    }

    // NEW: fetch all accommodations
    fetch(`${API_URL}/accommodations`)
      .then((res) => res.json())
      .then((data) => setAccommodations(data))
      .catch((err) => console.error(err));
  }, []);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, profileImage: "" }));
    }
  };

  const handleCoverImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setErrors((prev) => ({ ...prev, coverImages: "" }));

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        setCoverImages((prev) => [
          ...prev,
          {
            file,
            preview: reader.result,
            base64: reader.result,
          },
        ]);
      };

      reader.readAsDataURL(file);
    });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!accommodationName.trim()) {
      newErrors.accommodationName = "Accommodation name is required";
    }

    if (!businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (coverImages.length === 0) {
      newErrors.coverImages = "Please upload at least one cover image";
    }

    const storedCreateData = localStorage.getItem("createAccommodationData");
    const parsedData = storedCreateData ? JSON.parse(storedCreateData) : null;

    if (!profileImage && !profilePreview && !parsedData?.profileImageBase64) {
      newErrors.profileImage = "Please upload a profile picture";
    }

    if (!gcashNumber.trim()) {
      newErrors.gcashNumber = "GCash number is required";
    } else if (!/^09\d{9}$/.test(gcashNumber)) {
      newErrors.gcashNumber = "Enter a valid 11-digit GCash number (09XXXXXXXXX)";
    }

    if (!gcashAccountName.trim()) {
      newErrors.gcashAccountName = "GCash account name is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const isValid = validateForm();
    if (!isValid) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      localStorage.setItem(
        "createAccommodationData",
        JSON.stringify({
          accommodationName,
          businessAddress,
          description,
          profileImageBase64: reader.result,
          gcashNumber,
          gcashAccountName,
        })
      );

      localStorage.setItem("coverImages", JSON.stringify(coverImages));

      setIsLoading(true);

      setTimeout(() => {
        navigate("/property-owner/select-room-type");
      }, 2000);
    };

    if (profileImage) {
      reader.readAsDataURL(profileImage);
    } else {
      const storedCreateData = localStorage.getItem("createAccommodationData");
      const parsed = storedCreateData ? JSON.parse(storedCreateData) : null;

      localStorage.setItem(
        "createAccommodationData",
        JSON.stringify({
          accommodationName,
          businessAddress,
          description,
          profileImageBase64: parsed?.profileImageBase64 || profilePreview,
          gcashNumber,
          gcashAccountName,
        })
      );

      localStorage.setItem("coverImages", JSON.stringify(coverImages));

      setIsLoading(true);

      setTimeout(() => {
        navigate("/property-owner/select-room-type");
      }, 2000);
    }
  };

  return (
    <div className="property-owner-layout">
      
      {/* SIDEBAR */}
      <PropertyOwnerSidebar
        active="accommodations"
        isHidden={sidebarHidden}
      />

      {/* MAIN CONTENT */}
      <main
        className="property-owner-main"
        onClick={() => setSidebarHidden(true)}
      >
        
        <div className="po-accommodation-header">
          My Accommodations

          {sidebarHidden && (
            <MenuButton
              onClick={(e) => {
                e.stopPropagation();
                setSidebarHidden(false);
              }}
            />
          )}
        </div>

        {/* TABS */}
        <div className="po-tabs">
          <button
            className={`po-tab-btn ${activeTab === "list" ? "po-tab-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("list");
            }}
          >
            My Accommodations
          </button>
          <button
            className={`po-tab-btn ${activeTab === "create" ? "po-tab-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("create");
            }}
          >
            Create Accommodation
          </button>
        </div>

        {/* MY ACCOMMODATIONS LIST — only shown on "list" tab */}
        {activeTab === "list" && (
          <div className="po-accom-card-container">
            {accommodations.map((accom) => (
              <div key={accom._id} className="po-accom-card">

                <div className="po-accom-image">
                  <img
                    src={`${BASE_URL}${accom.profileImage}`}
                    alt={accom.accommodationName}
                  />
                </div>

                <div className="po-accom-info">
                  <h3>{accom.accommodationName}</h3>
                  <p>{accom.businessAddress}</p>

                  <button
  className="po-accom-open-btn"
  onClick={() => navigate(`/property-owner/accommodations/${accom._id}`)}
>
  Open
</button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* ACCOMMODATION FORM CARD — only shown on "create" tab */}
        {activeTab === "create" && (
          <div className="po-accommodation-card">
            <h3>Create Accommodation Details</h3>
            <p className="po-subtitle">
              Provide detailed information about your property.
            </p>

            {/* Accommodation Name */}
            <label>Accommodation Name</label>
            <input
              type="text"
              value={accommodationName}
              onChange={(e) => {
                setAccommodationName(e.target.value);
                setErrors((prev) => ({ ...prev, accommodationName: "" }));
              }}
            />
            {errors.accommodationName && (
              <p className="po-error-text">{errors.accommodationName}</p>
            )}

            {/* Business Address */}
            <label>Business Address</label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => {
                setBusinessAddress(e.target.value);
                setErrors((prev) => ({ ...prev, businessAddress: "" }));
              }}
            />
            {errors.businessAddress && (
              <p className="po-error-text">{errors.businessAddress}</p>
            )}

            {/* Description */}
            <label>Description</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
            ></textarea>
            {errors.description && (
              <p className="po-error-text">{errors.description}</p>
            )}

            {/* Profile Picture */}
            <label>Profile Picture</label>

            <label className="po-upload-btn">
              Click to Upload Profile Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleProfileImageChange}
                ref={fileInputRef}
              />
            </label>
            {errors.profileImage && (
              <p className="po-error-text">{errors.profileImage}</p>
            )}

            {profilePreview && (
              <div className="po-image-preview">
                <img src={profilePreview} alt="Profile Preview" />
                <button
                  type="button"
                  className="po-remove-img"
                  onClick={() => {
                    setProfileImage(null);
                    setProfilePreview(null);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Cover Images */}
            <label>Cover Images</label>

            <label className="po-upload-btn">
              Click to Upload Cover Images
              <input
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={handleCoverImagesChange}
              />
            </label>

            {coverImages.length > 0 && (
              <div className="po-more-preview">
                {coverImages.map((img, index) => (
                  <div key={index} className="po-more-image-box">
                    <img src={img.preview} alt={`cover-${index}`} />

                    <button
                      type="button"
                      className="po-remove-img"
                      onClick={() => {
                        setCoverImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <hr className="po-divider" />
            <div className="po-note-box">
              <p className="po-note-title">Important Note</p>
              <p>
                Please provide your GCash Number and GCash Account Name correctly.
                You must have a GCash App for online payments.
              </p>
            </div>

            {/* GCash Details */}
            <label>GCash Number</label>
            <input
              type="text"
              value={gcashNumber}
              onChange={(e) => {
                setGcashNumber(e.target.value);
                setErrors((prev) => ({ ...prev, gcashNumber: "" }));
              }}
              placeholder="09XXXXXXXXX"
            />
            {errors.gcashNumber && (
              <p className="po-error-text">{errors.gcashNumber}</p>
            )}

            <label>GCash Account Name</label>
            <input
              type="text"
              value={gcashAccountName}
              onChange={(e) => {
                setGcashAccountName(e.target.value);
                setErrors((prev) => ({ ...prev, gcashAccountName: "" }));
              }}
              placeholder="Account Holder Name"
            />
            {errors.gcashAccountName && (
              <p className="po-error-text">{errors.gcashAccountName}</p>
            )}

            {/* Action Buttons */}
            <div className="po-actions">
              <button
                type="button"
                className="po-delete-btn"
                onClick={handleDeleteAll}
              >
                Delete
              </button>
              <button
                type="button"
                className="po-next-btn"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </main>
      <LoadingModal show={isLoading} />
    </div>
  );
}
