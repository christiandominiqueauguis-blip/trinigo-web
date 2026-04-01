import MenuButton from "../../components/MenuButton";
import TrinidadLocationMap from "./TrinidadLocationMap";
import AccommodationStatusBadge from "./AccommodationStatusBadge";
import PricedFeatureMatrix from "./PricedFeatureMatrix";
import {
  ACCOMMODATION_STATUSES,
  ACCOMMODATION_TYPES,
  ACTIVITIES_LIST,
  AMENITIES_LIST,
  TRINIDAD_DESTINATION,
  formatBusinessAddress,
  getStatusMeta,
  sanitizePhoneNumber,
} from "./accommodationHelpers";

export default function AccommodationListingFormView({
  accommodationName,
  accommodationType,
  businessAddress,
  clearDraft,
  closedDescription,
  coverImages,
  description,
  gcashAccountName,
  gcashNumber,
  handleCoverImagesChange,
  handleNext,
  handleProfileImageChange,
  location,
  profileInputRef,
  profilePreview,
  removeCover,
  selectedActivities,
  selectedAmenities,
  setAccommodationName,
  setAccommodationType,
  setBusinessAddress,
  setClosedDescription,
  setDescription,
  setGcashAccountName,
  setGcashNumber,
  setLocation,
  setProfilePreview,
  setSidebarHidden,
  sidebarHidden,
  status,
  toggleActivity,
  toggleAmenity,
  updateActivityPrice,
  updateAmenityPrice,
  viewList,
  setStatus,
}) {
  return (
    <>
      <div className="acm-page-header">
        <div className="acm-page-header-left">
          {sidebarHidden ? <MenuButton onClick={() => setSidebarHidden(false)} /> : null}
          <div>
            <h2 className="acm-page-title">Create Accommodation</h2>
            <p className="acm-page-sub">
              Build a production-style listing for {TRINIDAD_DESTINATION.fullLabel}, then continue
              to room inventory setup.
            </p>
          </div>
        </div>

        <div className="acm-header-actions">
          <button type="button" className="acm-secondary-btn" onClick={viewList}>
            Back to Listings
          </button>
          <button type="button" className="acm-ghost-btn" onClick={clearDraft}>
            Clear Draft
          </button>
        </div>
      </div>

      <div className="acm-progress-card">
        <div>
          <span className="acm-kicker">Step 1 of 2</span>
          <h3>Listing Details</h3>
          <p>Business information, map location, amenities, media, and payment profile.</p>
        </div>
        <div className="acm-progress-steps">
          <span className="acm-step acm-step--active">Listing Details</span>
          <span className="acm-step">Room Types</span>
        </div>
      </div>

      <div className="acm-form-wrap">
        <section className="acm-form-section">
          <div className="acm-section-header">
            <div>
              <div className="acm-section-label">Business Profile</div>
              <p className="acm-section-hint">
                Add the core information guests will see first when they browse your listing.
              </p>
            </div>
            <AccommodationStatusBadge status={status} />
          </div>

          <div className="acm-field-grid acm-field-grid--double">
            <div className="acm-field">
              <label className="acm-label">
                Accommodation Name <span className="acm-req">*</span>
              </label>
              <input
                className="acm-input"
                type="text"
                placeholder="Example: Trinidad Hillside Resort"
                value={accommodationName}
                onChange={(event) => setAccommodationName(event.target.value)}
              />
            </div>

            <div className="acm-field">
              <label className="acm-label">
                Listing Status <span className="acm-req">*</span>
              </label>
              <select
                className="acm-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {ACCOMMODATION_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small className="acm-helper-text">{getStatusMeta(status).caption}</small>
            </div>
          </div>

          <div className="acm-field">
            <label className="acm-label">
              Accommodation Type <span className="acm-req">*</span>
            </label>
            <div className="acm-type-grid">
              {ACCOMMODATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`acm-type-btn ${accommodationType === type ? "acm-type-btn--active" : ""}`}
                  onClick={() => setAccommodationType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="acm-field">
            <label className="acm-label">
              Business Address <span className="acm-req">*</span>
            </label>
            <input
              className="acm-input"
              type="text"
              placeholder="House no., street, purok, barangay"
              value={businessAddress}
              onChange={(event) => setBusinessAddress(event.target.value)}
            />
            <div className="acm-badge-row">
              <span className="acm-location-badge">Coverage: Trinidad only</span>
              <span className="acm-location-badge">Province: Bohol</span>
              <span className="acm-location-badge">Country: Philippines</span>
            </div>
            <small className="acm-helper-text">
              Final listing address: {formatBusinessAddress(businessAddress)}
            </small>
          </div>

          <div className="acm-field">
            <label className="acm-label">
              Description <span className="acm-req">*</span>
            </label>
            <textarea
              className="acm-textarea"
              rows="5"
              placeholder="Highlight the property style, nearby attractions, target guests, and what makes it a strong real-world listing."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {status === "closed" ? (
            <div className="acm-alert-panel">
              <label className="acm-label">
                Closure Notice <span className="acm-req">*</span>
              </label>
              <textarea
                className="acm-textarea"
                rows="3"
                placeholder="Explain why the listing is temporarily closed and when it may reopen."
                value={closedDescription}
                onChange={(event) => setClosedDescription(event.target.value)}
              />
            </div>
          ) : null}
        </section>

        <section className="acm-form-section">
          <div className="acm-section-header">
            <div>
              <div className="acm-section-label">Business Location</div>
              <p className="acm-section-hint">
                Pin the exact property location using OpenStreetMap. Selection is limited to
                Trinidad, Bohol.
              </p>
            </div>
          </div>

          <TrinidadLocationMap location={location} onSelect={setLocation} canSelect />

          {location ? (
            <div className="acm-map-status">
              <span>
                Latitude: {location.lat} | Longitude: {location.lng}
              </span>
              <button type="button" className="acm-ghost-btn" onClick={() => setLocation(null)}>
                Clear Pin
              </button>
            </div>
          ) : (
            <p className="acm-location-empty">
              No location pinned yet. Click the map to choose the exact spot.
            </p>
          )}
        </section>

        <section className="acm-form-section">
          <div className="acm-section-header">
            <div>
              <div className="acm-section-label">Amenities</div>
              <p className="acm-section-hint">
                Select everything the accommodation truly offers to guests, then enter the manual
                price for each selected amenity.
              </p>
            </div>
            <span className="acm-selection-count">{selectedAmenities.length} selected</span>
          </div>

          <p className="acm-pricing-note">
            Every selected amenity must carry its own stored price so the listing stays complete
            and professionally managed.
          </p>

          <PricedFeatureMatrix
            options={AMENITIES_LIST}
            selected={selectedAmenities}
            toggle={toggleAmenity}
            onPriceChange={updateAmenityPrice}
          />
        </section>

        <section className="acm-form-section">
          <div className="acm-section-header">
            <div>
              <div className="acm-section-label">Activities and Experiences</div>
              <p className="acm-section-hint">
                Choose nearby or on-site experiences such as skydiving, scuba diving, trekking,
                and more, then add the manual rate for every selected activity.
              </p>
            </div>
            <span className="acm-selection-count">{selectedActivities.length} selected</span>
          </div>

          <p className="acm-pricing-note">
            Guests and admins should be able to review clear, stored pricing for each activity or
            experience attached to the accommodation.
          </p>

          <PricedFeatureMatrix
            options={ACTIVITIES_LIST}
            selected={selectedActivities}
            toggle={toggleActivity}
            onPriceChange={updateActivityPrice}
          />
        </section>

        <section className="acm-form-section">
          <div className="acm-section-header">
            <div>
              <div className="acm-section-label">Property Media</div>
              <p className="acm-section-hint">
                Upload the main cover image and the gallery images that best represent the property.
              </p>
            </div>
          </div>

          <div className="acm-field">
            <label className="acm-label">
              Profile Image <span className="acm-req">*</span>
            </label>
            <label className="acm-upload-zone">
              <span>Choose primary listing photo</span>
              <small>Best used as the card cover and feature image.</small>
              <input
                ref={profileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleProfileImageChange}
              />
            </label>

            {profilePreview ? (
              <div className="acm-profile-preview">
                <img src={profilePreview} alt="Profile preview" />
                <button
                  type="button"
                  className="acm-remove-btn"
                  onClick={() => {
                    setProfilePreview(null);
                    if (profileInputRef.current) {
                      profileInputRef.current.value = "";
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <div className="acm-field">
            <label className="acm-label">
              Cover Images <span className="acm-req">*</span>
            </label>
            <label className="acm-upload-zone">
              <span>Choose gallery images</span>
              <small>Upload multiple photos to build a real-world listing gallery.</small>
              <input type="file" hidden accept="image/*" multiple onChange={handleCoverImagesChange} />
            </label>

            {coverImages.length ? (
              <div className="acm-cover-grid">
                {coverImages.map((image, index) => (
                  <div key={image.id || index} className="acm-cover-thumb">
                    <img src={image.preview} alt={`Cover ${index + 1}`} />
                    <button type="button" className="acm-remove-btn" onClick={() => removeCover(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="acm-form-section">
          <div className="acm-section-header">
            <div>
              <div className="acm-section-label">Payment Details</div>
              <p className="acm-section-hint">
                Guests will use this GCash information for online payments.
              </p>
            </div>
          </div>

          <div className="acm-field-grid acm-field-grid--double">
            <div className="acm-field">
              <label className="acm-label">
                GCash Number <span className="acm-req">*</span>
              </label>
              <input
                className="acm-input"
                type="text"
                placeholder="09XXXXXXXXX"
                maxLength={11}
                value={gcashNumber}
                onChange={(event) => setGcashNumber(sanitizePhoneNumber(event.target.value))}
              />
            </div>

            <div className="acm-field">
              <label className="acm-label">
                GCash Account Name <span className="acm-req">*</span>
              </label>
              <input
                className="acm-input"
                type="text"
                placeholder="Registered GCash account name"
                value={gcashAccountName}
                onChange={(event) => setGcashAccountName(event.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="acm-form-actions">
          <button type="button" className="acm-secondary-btn" onClick={clearDraft}>
            Reset Form
          </button>
          <button type="button" className="acm-next-btn" onClick={handleNext}>
            Continue to Room Types
          </button>
        </div>
      </div>
    </>
  );
}
