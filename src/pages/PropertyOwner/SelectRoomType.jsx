import "./SelectRoomType.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal";
import MessageModal from "../../components/MessageModal";
import MenuButton from "../../components/MenuButton";

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
            <small className="po-error">
              {errors[roomName].availableRooms}
            </small>
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
              <img src={img.preview} alt={`${roomName}-${index}`} />

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

export default function SelectRoomType() {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomImages, setRoomImages] = useState({});
  const fileInputRefs = useRef({});
  const formScrollRef = useRef(null);
  const [roomData, setRoomData] = useState({});
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const handleOK = async () => {
    try {
      let newErrors = {};

      selectedRooms.forEach((room) => {
        if (!roomImages[room] || roomImages[room].length === 0) {
          newErrors[room] = {
            image: "Please upload at least one room image",
          };
        }
      });

      selectedRooms.forEach((room) => {
        if (!roomData?.[room]?.price) {
          newErrors[room] = {
            ...newErrors[room],
            price: "Room price is required",
          };
        }

        if (!roomData?.[room]?.availableRooms) {
          newErrors[room] = {
            ...newErrors[room],
            availableRooms: "Available rooms is required",
          };
        }

        if (!roomData?.[room]?.maxPersons) {
          newErrors[room] = {
            ...newErrors[room],
            maxPersons: "Max persons is required",
          };
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const createData = JSON.parse(
        localStorage.getItem("createAccommodationData")
      );

      const formData = new FormData();

      formData.append("accommodationName", createData.accommodationName);
      formData.append("businessAddress", createData.businessAddress);
      formData.append("description", createData.description);
      formData.append("gcashNumber", createData.gcashNumber);
      formData.append("gcashAccountName", createData.gcashAccountName);

      if (createData.profileImageBase64) {
        const arr = createData.profileImageBase64.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        const file = new File([u8arr], "profile.jpg", { type: mime });
        formData.append("profileImage", file);
      }

      formData.append("roomData", JSON.stringify(roomData));
      formData.append("selectedRooms", JSON.stringify(selectedRooms));

      const storedCoverImages = JSON.parse(
        localStorage.getItem("coverImages") || "[]"
      );

      storedCoverImages.forEach((imgObj, index) => {
        const arr = imgObj.base64.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        const file = new File([u8arr], `cover-${index}.jpg`, { type: mime });
        formData.append("coverImages", file);
      });

      selectedRooms.forEach((room) => {
        if (roomImages[room]?.length > 0) {
          roomImages[room].forEach((imgObj, index) => {
            const arr = imgObj.base64.split(",");
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }

            const file = new File([u8arr], `room-${room}-${index}.jpg`, {
              type: mime,
            });

            formData.append("roomImages", file);
            formData.append("roomImageNames", room);
          });
        }
      });

      const res = await fetch("http://localhost:4000/api/accommodations", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setModalMessage(data.message);
        setShowModal(true);
        return;
      }

      localStorage.removeItem("createAccommodationData");
      localStorage.removeItem("roomData");
      localStorage.removeItem("roomImages");
      localStorage.removeItem("selectedRooms");
      localStorage.removeItem("coverImages");

      setModalMessage("Saving accommodation...");
      setShowModal(true);
      setIsLoading(true);

      setTimeout(() => {
        setShowModal(false);
        navigate("/property-owner/dashboard");
      }, 2000);
    } catch (error) {
      console.error(error);
      setModalMessage("Server error. Please try again.");
      setShowModal(true);
    }
  };

  const handleRoomToggle = (room) => {
    setSelectedRooms((prev) =>
      prev.includes(room)
        ? prev.filter((r) => r !== room)
        : [...prev, room]
    );
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
            {
              file,
              preview: reader.result,
              base64: reader.result,
            },
          ],
        }));
      };

      reader.readAsDataURL(file);
    });

    setErrors((prev) => ({
      ...prev,
      [room]: {
        ...prev[room],
        image: "",
      },
    }));
  };

  const handleRoomInputChange = (room, field, value) => {
    setRoomData((prev) => ({
      ...prev,
      [room]: {
        ...prev[room],
        [field]: value,
      },
    }));

    setErrors((prev) => {
      if (!prev[room]?.[field]) return prev;

      return {
        ...prev,
        [room]: {
          ...prev[room],
          [field]: "",
        },
      };
    });
  };

  useEffect(() => {
    const storedRoomData = localStorage.getItem("roomData");
    const storedRoomImages = localStorage.getItem("roomImages");
    const storedSelectedRooms = localStorage.getItem("selectedRooms");

    if (storedRoomData) setRoomData(JSON.parse(storedRoomData));
    if (storedRoomImages) setRoomImages(JSON.parse(storedRoomImages));
    if (storedSelectedRooms) setSelectedRooms(JSON.parse(storedSelectedRooms));
  }, []);

  useEffect(() => {
    if (selectedRooms.length > 0 && formScrollRef.current) {
      formScrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedRooms]);

  const handleBack = () => {
    localStorage.setItem("roomData", JSON.stringify(roomData));
    localStorage.setItem("roomImages", JSON.stringify(roomImages));
    localStorage.setItem("selectedRooms", JSON.stringify(selectedRooms));

    setModalMessage("Returning to Create Accommodation...");
    setShowModal(true);
    setIsLoading(true);

    setTimeout(() => {
      setShowModal(false);
      navigate("/property-owner/create-accommodation");
    }, 2000);
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
        
        {/* GREEN HEADER */}
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

        {/* MANAGE ROOM TYPES CARD */}
        <div className="po-room-card">
          <h3>Manage Room Types</h3>
          <p className="po-subtitle">
            Define and configure the different room types available at your property.
          </p>

          <div className="po-room-checkboxes">
            {["Single Room", "Double Room", "Deluxe Room", "Family Room", "Dormitory Room", "Double Deluxe Room"].map((room) => (
              <label key={room}>
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={() => handleRoomToggle(room)}
                />
                {room}
              </label>
            ))}
          </div>
        </div>

        <div className="po-room-forms-scroll">
          {["Single Room", "Double Room", "Deluxe Room", "Family Room", "Dormitory Room", "Double Deluxe Room"].map((room) => (
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
              errors={errors}
              handleRoomInputChange={handleRoomInputChange}
            />
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="po-actions">
          <button className="po-back-btn" onClick={handleBack}>
            Back
          </button>

          <button className="po-ok-btn" onClick={handleOK}>
            OK
          </button>
        </div>

      </main>

      <MessageModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        showButton={false}
        autoClose={true}
        duration={2000}
      />

      <LoadingModal show={isLoading} />
    </div>
  );
}