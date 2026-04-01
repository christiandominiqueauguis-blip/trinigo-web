import { BASE_URL } from "../../config/api";

const OWNER_SESSION_KEYS = [
  "ownerId",
  "ownerFullName",
  "ownerGender",
  "ownerEmail",
  "ownerPhone",
  "ownerStatus",
  "ownerAuthToken",
  "propertyOwnerProfileImage",
  "accommodationName",
  "propertyType",
];

export function buildOwnerProfileImage(profileImage) {
  if (!profileImage) return "";
  if (String(profileImage).startsWith("http")) return profileImage;
  if (String(profileImage).startsWith("data:")) return profileImage;
  return `${BASE_URL}${profileImage}`;
}

export function saveOwnerSession(owner) {
  if (!owner) return;

  if (owner.id || owner._id) {
    localStorage.setItem("ownerId", String(owner.id || owner._id));
  }

  localStorage.setItem("ownerFullName", owner.fullName || "");
  localStorage.setItem("ownerGender", owner.gender || "");
  localStorage.setItem("ownerEmail", owner.email || "");
  localStorage.setItem("ownerPhone", owner.phone || "");
  localStorage.setItem("ownerStatus", owner.status || "");
  localStorage.setItem(
    "ownerAuthToken",
    owner.token !== undefined ? owner.token || "" : localStorage.getItem("ownerAuthToken") || ""
  );
  localStorage.setItem("propertyOwnerProfileImage", owner.profileImage || "");
  window.dispatchEvent(new Event("owner-profile-updated"));
}

export function clearOwnerSession() {
  OWNER_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("owner-profile-updated"));
}
