const STORAGE_KEY = "tourismManagerNotificationState";

function readState() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(nextState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function normalizeEntry(entry) {
  return {
    readIds: Array.isArray(entry?.readIds) ? entry.readIds : [],
    hiddenIds: Array.isArray(entry?.hiddenIds) ? entry.hiddenIds : [],
  };
}

export function getTourismManagerNotificationState(managerId) {
  if (!managerId) return normalizeEntry();
  const fullState = readState();
  return normalizeEntry(fullState[managerId]);
}

export function saveTourismManagerNotificationState(managerId, nextEntry) {
  if (!managerId) return;
  const fullState = readState();
  fullState[managerId] = normalizeEntry(nextEntry);
  writeState(fullState);
}

export function markTourismManagerNotificationsRead(managerId, notificationIds = []) {
  const current = getTourismManagerNotificationState(managerId);
  const nextReadIds = new Set(current.readIds);
  notificationIds.forEach((id) => {
    if (id) nextReadIds.add(String(id));
  });

  saveTourismManagerNotificationState(managerId, {
    ...current,
    readIds: Array.from(nextReadIds),
  });
}

export function hideTourismManagerNotifications(managerId, notificationIds = []) {
  const current = getTourismManagerNotificationState(managerId);
  const nextHiddenIds = new Set(current.hiddenIds);
  notificationIds.forEach((id) => {
    if (id) nextHiddenIds.add(String(id));
  });

  saveTourismManagerNotificationState(managerId, {
    ...current,
    hiddenIds: Array.from(nextHiddenIds),
  });
}

export function clearTourismManagerNotificationState(managerId) {
  if (!managerId) return;
  const fullState = readState();
  delete fullState[managerId];
  writeState(fullState);
}

export function buildTourismManagerNotifications(reports = [], managerId = "") {
  return reports
    .filter((item) => String(item?.managerId || "") === String(managerId))
    .map((item) => {
      const status = String(item?.status || "Pending");
      const statusLower = status.toLowerCase();
      const fileName = item?.fileName || "Tourist spot report";
      const spotName = item?.touristSpotName || "Tourist spot";

      let title = "Report submitted";
      let message = `${fileName} was submitted for ${spotName}.`;

      if (statusLower === "approved") {
        title = "Report approved";
        message = `${fileName} for ${spotName} has been approved.`;
      } else if (statusLower === "rejected") {
        title = "Report rejected";
        message = `${fileName} for ${spotName} was rejected. Please review it.`;
      }

      return {
        _id: String(item?._id || `${spotName}-${fileName}-${item?.createdAt || ""}`),
        title,
        message,
        status,
        createdAt: item?.createdAt || "",
        touristSpotName: spotName,
        fileName,
      };
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function applyTourismManagerNotificationState(notifications = [], managerId = "") {
  const { readIds, hiddenIds } = getTourismManagerNotificationState(managerId);
  const readSet = new Set(readIds.map(String));
  const hiddenSet = new Set(hiddenIds.map(String));

  return notifications
    .filter((item) => !hiddenSet.has(String(item._id)))
    .map((item) => ({
      ...item,
      isRead: readSet.has(String(item._id)),
    }));
}
