import { MAX_PERSONS_OPTIONS, ROOM_TYPES } from "./accommodationHelpers";

function RoomForm({
  errors,
  handleRoomImageChange,
  handleRoomInputChange,
  isEditing,
  roomData,
  roomImages,
  roomName,
  selectedRooms,
  setRoomImages,
}) {
  if (!selectedRooms.includes(roomName)) return null;

  return (
    <div className="edit-room-form">
      <h3 className="edit-room-title">{roomName}</h3>
      <div className="edit-room-inputs">
        <div className="edit-room-field">
          <label>Price per Night</label>
          <input
            type="number"
            min="0"
            value={roomData?.[roomName]?.price || ""}
            disabled={!isEditing}
            onChange={(event) => handleRoomInputChange(roomName, "price", event.target.value)}
          />
          {errors?.[roomName]?.price ? <small className="edit-err">{errors[roomName].price}</small> : null}
        </div>

        <div className="edit-room-field">
          <label>Available Rooms</label>
          <input
            type="number"
            min="1"
            value={roomData?.[roomName]?.availableRooms || ""}
            disabled={!isEditing}
            onChange={(event) => handleRoomInputChange(roomName, "availableRooms", event.target.value)}
          />
          {errors?.[roomName]?.availableRooms ? (
            <small className="edit-err">{errors[roomName].availableRooms}</small>
          ) : null}
        </div>

        <div className="edit-room-field">
          <label>Max Persons</label>
          <select
            value={roomData?.[roomName]?.maxPersons || ""}
            disabled={!isEditing}
            onChange={(event) => handleRoomInputChange(roomName, "maxPersons", event.target.value)}
          >
            <option value="">Select</option>
            {MAX_PERSONS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          {errors?.[roomName]?.maxPersons ? (
            <small className="edit-err">{errors[roomName].maxPersons}</small>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <label className="edit-upload-btn">
          Upload Room Images
          <input
            type="file"
            hidden
            accept="image/*"
            multiple
            onChange={(event) => handleRoomImageChange(roomName, event)}
          />
        </label>
      ) : null}

      {roomImages[roomName]?.length ? (
        <div className="edit-room-img-grid">
          {roomImages[roomName].map((image, index) => (
            <div key={`${roomName}-${index}`} className="edit-room-img-thumb">
              <img src={image.preview} alt={`${roomName}-${index + 1}`} />
              {isEditing ? (
                <button
                  type="button"
                  className="edit-remove-img"
                  onClick={() =>
                    setRoomImages((current) => ({
                      ...current,
                      [roomName]: current[roomName].filter((_, imageIndex) => imageIndex !== index),
                    }))
                  }
                >
                  x
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AccommodationRoomEditorSection(props) {
  const { isEditing, selectedRooms, setSelectedRooms } = props;

  return (
    <div className="edit-section">
      <div className="edit-section-title">
        <span className="edit-section-num">07</span> Room Types
      </div>

      <p className="edit-room-note">
        Room inventory is optional. You can leave this empty and add room types later whenever the
        accommodation is ready for booking inventory.
      </p>

      <div className="edit-room-chips">
        {ROOM_TYPES.map((room) => (
          <label key={room}>
            <input
              type="checkbox"
              checked={selectedRooms.includes(room)}
              disabled={!isEditing}
              onChange={() =>
                isEditing &&
                setSelectedRooms((current) =>
                  current.includes(room)
                    ? current.filter((item) => item !== room)
                    : [...current, room]
                )
              }
            />
            {room}
          </label>
        ))}
      </div>

      {selectedRooms.length === 0 ? (
        <p className="edit-room-empty">
          No room types selected yet. This accommodation can still be saved without room inventory.
        </p>
      ) : null}

      {ROOM_TYPES.map((room) => (
        <RoomForm key={room} roomName={room} {...props} />
      ))}
    </div>
  );
}
