export const TRINIDAD_DESTINATION = {
  municipality: "Trinidad",
  province: "Bohol",
  country: "Philippines",
  fullLabel: "Trinidad, Bohol, Philippines",
};

export const TRINIDAD_CENTER = [9.9598, 124.3661];
export const TRINIDAD_BOUNDS = [
  [9.8, 124.22],
  [10.08, 124.52],
];

export const ACCOMMODATION_TYPES = [
  "Hotel",
  "Resort",
  "Pension House",
  "Inn",
  "Hostel",
  "Guesthouse",
  "Apartment / Condo",
  "Cottage / Villa",
  "Camping Site",
  "Farm Stay",
];

export const ACCOMMODATION_STATUSES = [
  {
    value: "open",
    label: "Open",
    description: "Guests can browse and book this listing.",
  },
  {
    value: "closed",
    label: "Closed",
    description: "Listing stays visible, but booking is paused.",
  },
];

export const AMENITIES_LIST = [
  { key: "wifi", label: "Free WiFi" },
  { key: "parking", label: "Parking" },
  { key: "pool", label: "Swimming Pool" },
  { key: "ac", label: "Air Conditioning" },
  { key: "restaurant", label: "Restaurant" },
  { key: "bar", label: "Bar / Lounge" },
  { key: "gym", label: "Gym / Fitness" },
  { key: "laundry", label: "Laundry Service" },
  { key: "roomsvc", label: "Room Service" },
  { key: "reception", label: "24/7 Front Desk" },
  { key: "cctv", label: "CCTV / Security" },
  { key: "pets", label: "Pet-Friendly" },
  { key: "breakfast", label: "Breakfast Included" },
  { key: "conference", label: "Conference Room" },
  { key: "spa", label: "Spa / Wellness" },
];

export const ACTIVITIES_LIST = [
  { key: "skydiving", label: "Skydiving" },
  { key: "zipline", label: "Zip Line" },
  { key: "atv", label: "ATV Ride" },
  { key: "island", label: "Island Hopping" },
  { key: "snorkeling", label: "Snorkeling" },
  { key: "diving", label: "Scuba Diving" },
  { key: "hiking", label: "Hiking / Trekking" },
  { key: "birdwatch", label: "Bird Watching" },
  { key: "rivertubing", label: "River Tubing" },
  { key: "kayaking", label: "Kayaking" },
  { key: "waterfall", label: "Waterfall Visit" },
  { key: "cave", label: "Cave Exploration" },
  { key: "camping", label: "Camping" },
];

export const ROOM_TYPES = [
  "Single Room",
  "Double Room",
  "Deluxe Room",
  "Family Room",
  "Dormitory Room",
  "Double Deluxe Room",
];

export const MAX_PERSONS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A to Z" },
  { value: "za", label: "Z to A" },
];

export const DRAFT_STORAGE_KEYS = {
  listing: "createAccommodationData",
  roomData: "roomData",
  roomImages: "roomImages",
  selectedRooms: "selectedRooms",
  coverImages: "coverImages",
};

const PRICE_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function formatCurrencyInput(value) {
  const normalized = String(value ?? "").replace(/[^\d.]/g, "");
  const parts = normalized.split(".");

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

export function formatPhilippineCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Price pending";
  }

  return PRICE_FORMATTER.format(amount);
}

export function buildPricedSelections(options, pricingSource = [], fallbackKeys = []) {
  const optionMap = new Map(options.map((option) => [option.key, option]));
  const selectionMap = new Map();

  const applyEntry = (entry) => {
    const key = typeof entry === "string" ? entry : entry?.key;

    if (!key) return;

    const option = optionMap.get(key);
    selectionMap.set(key, {
      key,
      label: entry?.label || option?.label || key,
      price:
        entry?.price === 0 || entry?.price
          ? String(entry.price)
          : selectionMap.get(key)?.price || "",
    });
  };

  if (Array.isArray(pricingSource)) {
    pricingSource.forEach(applyEntry);
  }

  if (Array.isArray(fallbackKeys)) {
    fallbackKeys.forEach(applyEntry);
  }

  return Array.from(selectionMap.values());
}

export function togglePricedSelection(currentSelections, options, key) {
  const existing = Array.isArray(currentSelections) ? currentSelections : [];
  const hasSelection = existing.some((item) => item.key === key);

  if (hasSelection) {
    return existing.filter((item) => item.key !== key);
  }

  const option = options.find((item) => item.key === key);

  return [
    ...existing,
    {
      key,
      label: option?.label || key,
      price: "",
    },
  ];
}

export function updatePricedSelectionPrice(currentSelections, key, price) {
  return (Array.isArray(currentSelections) ? currentSelections : []).map((item) =>
    item.key === key
      ? {
          ...item,
          price: formatCurrencyInput(price),
        }
      : item
  );
}

export function getSelectedPricingKeys(selections) {
  return (Array.isArray(selections) ? selections : [])
    .map((item) => item?.key)
    .filter(Boolean);
}

export function getPricedSelectionsPayload(selections, options = []) {
  const optionMap = new Map(options.map((option) => [option.key, option]));

  return (Array.isArray(selections) ? selections : [])
    .map((item) => {
      const key = item?.key;
      const price = Number(item?.price);

      if (!key || !Number.isFinite(price) || price <= 0) {
        return null;
      }

      return {
        key,
        label: item?.label || optionMap.get(key)?.label || key,
        price,
      };
    })
    .filter(Boolean);
}

export function getMissingPriceSelections(selections) {
  return (Array.isArray(selections) ? selections : []).filter((item) => {
    const price = Number(item?.price);
    return !item?.key || !Number.isFinite(price) || price <= 0;
  });
}

export function readAccommodationDraft() {
  if (typeof window === "undefined") {
    return {
      listing: null,
      roomData: {},
      roomImages: {},
      selectedRooms: [],
      coverImages: [],
    };
  }

  return {
    listing: safeJsonParse(localStorage.getItem(DRAFT_STORAGE_KEYS.listing), null),
    roomData: safeJsonParse(localStorage.getItem(DRAFT_STORAGE_KEYS.roomData), {}),
    roomImages: safeJsonParse(localStorage.getItem(DRAFT_STORAGE_KEYS.roomImages), {}),
    selectedRooms: safeJsonParse(localStorage.getItem(DRAFT_STORAGE_KEYS.selectedRooms), []),
    coverImages: safeJsonParse(localStorage.getItem(DRAFT_STORAGE_KEYS.coverImages), []),
  };
}

export function clearAccommodationDraft() {
  if (typeof window === "undefined") return;
  Object.values(DRAFT_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function saveAccommodationListingDraft(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEYS.listing, JSON.stringify(data));
}

export function saveAccommodationRoomDraft({ roomData, roomImages, selectedRooms }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEYS.roomData, JSON.stringify(roomData));
  localStorage.setItem(DRAFT_STORAGE_KEYS.roomImages, JSON.stringify(roomImages));
  localStorage.setItem(DRAFT_STORAGE_KEYS.selectedRooms, JSON.stringify(selectedRooms));
}

export function saveAccommodationCoverDraft(coverImages) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEYS.coverImages, JSON.stringify(coverImages));
}

export function normalizeAccommodationStatus(status) {
  return String(status || "open").toLowerCase() === "closed" ? "closed" : "open";
}

export function getStatusMeta(status) {
  const normalized = normalizeAccommodationStatus(status);

  return normalized === "closed"
    ? {
        value: "closed",
        label: "Closed",
        caption: "Booking paused",
      }
    : {
        value: "open",
        label: "Open",
        caption: "Accepting guests",
      };
}

export function isWithinTrinidadBounds(location) {
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
    return false;
  }

  const [[south, west], [north, east]] = TRINIDAD_BOUNDS;

  return (
    location.lat >= south &&
    location.lat <= north &&
    location.lng >= west &&
    location.lng <= east
  );
}

export function formatBusinessAddress(address) {
  const trimmed = String(address || "").trim();

  if (!trimmed) return TRINIDAD_DESTINATION.fullLabel;

  const lower = trimmed.toLowerCase();
  const hasTrinidad = lower.includes("trinidad");
  const hasBohol = lower.includes("bohol");
  const hasPhilippines = lower.includes("philippines");

  if (hasTrinidad && hasBohol && hasPhilippines) return trimmed;
  if (hasTrinidad && hasBohol) return `${trimmed}, Philippines`;
  if (hasTrinidad) return `${trimmed}, Bohol, Philippines`;

  return `${trimmed}, Trinidad, Bohol, Philippines`;
}

export function sanitizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

export function getAccommodationType(accommodation) {
  return accommodation?.accommodationType || accommodation?.propertyType || "Accommodation";
}

export function getAccommodationRoomNames(accommodation) {
  if (Array.isArray(accommodation?.selectedRooms) && accommodation.selectedRooms.length > 0) {
    return accommodation.selectedRooms;
  }

  if (Array.isArray(accommodation?.rooms)) {
    return accommodation.rooms
      .map((room) => room?.roomName)
      .filter(Boolean);
  }

  return [];
}

export function getAccommodationOwnerId(accommodation) {
  const owner = accommodation?.ownerId || accommodation?.owner || accommodation?.propertyOwnerId;

  if (!owner) return "";
  if (typeof owner === "string") return owner;
  if (typeof owner === "object") return owner._id || owner.id || "";

  return "";
}

export function matchesOwner(accommodation, ownerId) {
  if (!ownerId) return true;

  const normalizedOwnerId = String(ownerId);
  const candidateOwnerId = getAccommodationOwnerId(accommodation);

  if (!candidateOwnerId) return true;

  return String(candidateOwnerId) === normalizedOwnerId;
}

export function normalizeAccommodationRecord(accommodation) {
  const amenityPricing = buildPricedSelections(
    AMENITIES_LIST,
    accommodation?.amenityPricing,
    accommodation?.amenities
  );
  const activityPricing = buildPricedSelections(
    ACTIVITIES_LIST,
    accommodation?.activityPricing,
    accommodation?.activities
  );

  return {
    ...accommodation,
    accommodationType: getAccommodationType(accommodation),
    businessAddress: formatBusinessAddress(accommodation?.businessAddress),
    amenityPricing,
    activityPricing,
    amenities: getSelectedPricingKeys(amenityPricing),
    activities: getSelectedPricingKeys(activityPricing),
    status: normalizeAccommodationStatus(accommodation?.status),
    selectedRooms: getAccommodationRoomNames(accommodation),
  };
}

export function sortAccommodations(accommodations, sortBy) {
  const copy = [...accommodations];

  copy.sort((left, right) => {
    if (sortBy === "az") {
      return String(left.accommodationName || "").localeCompare(String(right.accommodationName || ""));
    }

    if (sortBy === "za") {
      return String(right.accommodationName || "").localeCompare(String(left.accommodationName || ""));
    }

    if (sortBy === "oldest") {
      return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
    }

    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });

  return copy;
}

export function getOptionLabel(options, key) {
  return options.find((option) => option.key === key)?.label || key;
}
