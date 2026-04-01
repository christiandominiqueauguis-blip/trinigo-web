import "leaflet/dist/leaflet.css";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import LoadingModal from "../../components/LoadingModal";
import { API_URL } from "../../config/api";
import AccommodationListingFormView from "./AccommodationListingFormView";
import AccommodationOwnerListView from "./AccommodationOwnerListView";
import {
  ACTIVITIES_LIST,
  AMENITIES_LIST,
  buildPricedSelections,
  clearAccommodationDraft,
  formatBusinessAddress,
  getAccommodationRoomNames,
  getMissingPriceSelections,
  getSelectedPricingKeys,
  isWithinTrinidadBounds,
  matchesOwner,
  normalizeAccommodationRecord,
  readAccommodationDraft,
  saveAccommodationCoverDraft,
  saveAccommodationListingDraft,
  sortAccommodations,
  togglePricedSelection,
  updatePricedSelectionPrice,
} from "./accommodationHelpers";

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  return { toasts, addToast };
}

function ToastStack({ toasts }) {
  return (
    <div className="acm-toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`acm-toast acm-toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function hasDraftContent(fields) {
  return Boolean(
    fields.accommodationName ||
      fields.accommodationType ||
      fields.businessAddress ||
      fields.description ||
      fields.profilePreview ||
      fields.coverImages.length ||
      fields.gcashNumber ||
      fields.gcashAccountName ||
      fields.location ||
      fields.selectedAmenities.length ||
      fields.selectedActivities.length ||
      fields.closedDescription
  );
}

export default function PropertyOwnerAccommodationWorkspace() {
  const navigate = useNavigate();
  const profileInputRef = useRef(null);
  const { toasts, addToast } = useToast();
  const ownerId = localStorage.getItem("ownerId") || "";

  const [view, setView] = useState("list");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasDraft, setHasDraft] = useState(Boolean(readAccommodationDraft().listing));

  const [accommodations, setAccommodations] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");

  const [accommodationName, setAccommodationName] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [description, setDescription] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashAccountName, setGcashAccountName] = useState("");
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverImages, setCoverImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [status, setStatus] = useState("open");
  const [closedDescription, setClosedDescription] = useState("");

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const resetForm = useCallback(() => {
    setAccommodationName("");
    setAccommodationType("");
    setBusinessAddress("");
    setDescription("");
    setGcashNumber("");
    setGcashAccountName("");
    setProfilePreview(null);
    setCoverImages([]);
    setLocation(null);
    setSelectedAmenities([]);
    setSelectedActivities([]);
    setStatus("open");
    setClosedDescription("");

    if (profileInputRef.current) {
      profileInputRef.current.value = "";
    }
  }, []);

  const restoreDraft = useCallback((draft) => {
    if (!draft?.listing) return false;

    setAccommodationName(draft.listing.accommodationName || "");
    setAccommodationType(draft.listing.accommodationType || "");
    setBusinessAddress(draft.listing.businessAddressInput || draft.listing.businessAddress || "");
    setDescription(draft.listing.description || "");
    setGcashNumber(draft.listing.gcashNumber || "");
    setGcashAccountName(draft.listing.gcashAccountName || "");
    setProfilePreview(draft.listing.profileImageBase64 || null);
    setCoverImages(Array.isArray(draft.coverImages) ? draft.coverImages : []);
    setLocation(draft.listing.location || null);
    setSelectedAmenities(
      buildPricedSelections(
        AMENITIES_LIST,
        draft.listing.amenityPricing,
        Array.isArray(draft.listing.amenities) ? draft.listing.amenities : []
      )
    );
    setSelectedActivities(
      buildPricedSelections(
        ACTIVITIES_LIST,
        draft.listing.activityPricing,
        Array.isArray(draft.listing.activities) ? draft.listing.activities : []
      )
    );
    setStatus(draft.listing.status || "open");
    setClosedDescription(draft.listing.closedDescription || "");
    setHasDraft(true);
    setView("add");
    return true;
  }, []);

  const clearDraft = useCallback(() => {
    clearAccommodationDraft();
    setHasDraft(false);
    resetForm();
  }, [resetForm]);

  const fetchAccommodations = useCallback(async () => {
    setIsFetching(true);

    try {
      const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
      const response = await fetch(`${API_URL}/accommodations${query}`);
      const data = await response.json();
      const nextItems = Array.isArray(data)
        ? data.filter((item) => matchesOwner(item, ownerId)).map(normalizeAccommodationRecord)
        : [];

      setAccommodations(nextItems);
    } catch (error) {
      console.error(error);
      addToast("Unable to load your accommodations right now.", "error");
    } finally {
      setIsFetching(false);
    }
  }, [addToast, ownerId]);

  useEffect(() => {
    fetchAccommodations();
  }, [fetchAccommodations]);

  useEffect(() => {
    restoreDraft(readAccommodationDraft());
  }, [restoreDraft]);

  useEffect(() => {
    if (view !== "add") return;
    if (!hasDraftContent({
      accommodationName,
      accommodationType,
      businessAddress,
      description,
      profilePreview,
      coverImages,
      gcashNumber,
      gcashAccountName,
      location,
      selectedAmenities,
      selectedActivities,
      closedDescription,
    })) {
      return;
    }

    saveAccommodationListingDraft({
      accommodationName,
      accommodationType,
      businessAddressInput: businessAddress,
      businessAddress: formatBusinessAddress(businessAddress),
      description,
      profileImageBase64: profilePreview,
      gcashNumber,
      gcashAccountName,
      location,
      amenities: getSelectedPricingKeys(selectedAmenities),
      activities: getSelectedPricingKeys(selectedActivities),
      amenityPricing: selectedAmenities,
      activityPricing: selectedActivities,
      status,
      closedDescription,
    });
    saveAccommodationCoverDraft(coverImages);
    setHasDraft(true);
  }, [
    accommodationName,
    accommodationType,
    businessAddress,
    closedDescription,
    coverImages,
    description,
    gcashAccountName,
    gcashNumber,
    location,
    profilePreview,
    selectedActivities,
    selectedAmenities,
    status,
    view,
  ]);

  const filteredAccommodations = sortAccommodations(
    accommodations.filter((accommodation) => {
      const matchesStatus = filterStatus === "all" || accommodation.status === filterStatus;
      if (!matchesStatus) return false;
      if (!deferredSearch) return true;

      const searchable = [
        accommodation.accommodationName,
        accommodation.businessAddress,
        accommodation.accommodationType,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(deferredSearch);
    }),
    sortBy
  );

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleCoverImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImages((current) => [
          ...current,
          {
            id: `${file.name}-${file.size}-${Date.now()}-${index}`,
            preview: String(reader.result || ""),
            base64: String(reader.result || ""),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleNext = () => {
    const errors = [];
    if (!accommodationName.trim()) errors.push("Accommodation name is required.");
    if (!accommodationType) errors.push("Select an accommodation type.");
    if (!businessAddress.trim()) errors.push("Business address is required.");
    if (description.trim().length < 40) errors.push("Description should be at least 40 characters.");
    if (!location) errors.push("Choose the exact business location on the map.");
    if (location && !isWithinTrinidadBounds(location)) errors.push("Pinned location must stay within Trinidad, Bohol.");
    if (!profilePreview) errors.push("Upload a profile image for the listing.");
    if (coverImages.length === 0) errors.push("Upload at least one cover image.");
    if (!gcashNumber) errors.push("GCash number is required.");
    else if (!/^09\d{9}$/.test(gcashNumber)) errors.push("Use a valid 11-digit GCash number starting with 09.");
    if (!gcashAccountName.trim()) errors.push("GCash account name is required.");
    if (status === "closed" && !closedDescription.trim()) errors.push("Add a closure notice if the listing is closed.");
    if (getMissingPriceSelections(selectedAmenities).length) {
      errors.push("Enter a valid price for every selected amenity.");
    }
    if (getMissingPriceSelections(selectedActivities).length) {
      errors.push("Enter a valid price for every selected activity or experience.");
    }

    if (errors.length) {
      errors.forEach((message, index) => setTimeout(() => addToast(message, "error"), index * 120));
      return;
    }

    setIsLoading(true);
    setTimeout(() => navigate("/property-owner/select-room-type"), 650);
  };

  const stats = {
    totalListings: accommodations.length,
    totalOpen: accommodations.filter((item) => item.status === "open").length,
    totalClosed: accommodations.filter((item) => item.status === "closed").length,
    totalRoomTypes: accommodations.reduce((count, item) => count + getAccommodationRoomNames(item).length, 0),
  };

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="accommodations"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main">
        {view === "list" ? (
          <AccommodationOwnerListView
            accommodations={filteredAccommodations}
            filterStatus={filterStatus}
            hasDraft={hasDraft}
            isFetching={isFetching}
            onAddNew={() => {
              clearDraft();
              setView("add");
            }}
            onDiscardDraft={() => {
              clearDraft();
              addToast("Draft removed.", "success");
            }}
            onManageListing={(id) => navigate(`/property-owner/accommodations/${id}`)}
            onResumeDraft={() => {
              const restored = restoreDraft(readAccommodationDraft());
              if (!restored) addToast("No saved draft was found.", "error");
            }}
            search={search}
            setFilterStatus={setFilterStatus}
            setSearch={setSearch}
            setSidebarHidden={setSidebarHidden}
            setSortBy={setSortBy}
            sidebarHidden={sidebarHidden}
            sortBy={sortBy}
            stats={stats}
          />
        ) : (
          <AccommodationListingFormView
            accommodationName={accommodationName}
            accommodationType={accommodationType}
            businessAddress={businessAddress}
            clearDraft={clearDraft}
            closedDescription={closedDescription}
            coverImages={coverImages}
            description={description}
            gcashAccountName={gcashAccountName}
            gcashNumber={gcashNumber}
            handleCoverImagesChange={handleCoverImagesChange}
            handleNext={handleNext}
            handleProfileImageChange={handleProfileImageChange}
            location={location}
            profileInputRef={profileInputRef}
            profilePreview={profilePreview}
            removeCover={(index) => setCoverImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            selectedActivities={selectedActivities}
            selectedAmenities={selectedAmenities}
            setAccommodationName={setAccommodationName}
            setAccommodationType={setAccommodationType}
            setBusinessAddress={setBusinessAddress}
            setClosedDescription={setClosedDescription}
            setDescription={setDescription}
            setGcashAccountName={setGcashAccountName}
            setGcashNumber={setGcashNumber}
            setLocation={setLocation}
            setProfilePreview={setProfilePreview}
            setSidebarHidden={setSidebarHidden}
            sidebarHidden={sidebarHidden}
            status={status}
            toggleActivity={(key) =>
              setSelectedActivities((current) =>
                togglePricedSelection(current, ACTIVITIES_LIST, key)
              )
            }
            toggleAmenity={(key) =>
              setSelectedAmenities((current) =>
                togglePricedSelection(current, AMENITIES_LIST, key)
              )
            }
            updateActivityPrice={(key, price) =>
              setSelectedActivities((current) => updatePricedSelectionPrice(current, key, price))
            }
            updateAmenityPrice={(key, price) =>
              setSelectedAmenities((current) => updatePricedSelectionPrice(current, key, price))
            }
            viewList={() => setView("list")}
            setStatus={setStatus}
          />
        )}
      </main>

      <ToastStack toasts={toasts} />
      <LoadingModal show={isLoading} />
    </div>
  );
}
