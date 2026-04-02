const ROLE_CONFIG = {
  admin: {
    idKey: "adminId",
    tokenKey: "adminAuthToken",
    nameKey: "fullName",
    homePath: "/admin/dashboard",
    loginPath: "/admin/login",
    clearKeys: ["adminId", "fullName", "adminProfileImage", "adminAuthToken"],
  },
  propertyOwner: {
    idKey: "ownerId",
    tokenKey: "ownerAuthToken",
    nameKey: "ownerFullName",
    homePath: "/property-owner/dashboard",
    loginPath: "/property-owner/login",
    clearKeys: [
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
    ],
  },
  tourismManager: {
    idKey: "tourismManagerId",
    tokenKey: "tourismManagerAuthToken",
    nameKey: "tourismManagerFullName",
    homePath: "/tourism-site-manager/dashboard",
    loginPath: "/tourism-site-manager/login",
    clearKeys: [
      "tourismManagerId",
      "tourismManagerFullName",
      "tourismManagerName",
      "tourismManagerUsername",
      "tourismManagerProfileImage",
      "tourismManagerAuthToken",
      "tourismManagerAssignedSpotId",
      "tourismManagerAssignedSpotName",
      "tourismManagerProfile",
    ],
  },
};

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || null;
}

export function getRoleSession(role) {
  const config = getRoleConfig(role);
  if (!config) return null;

  return {
    role,
    id: localStorage.getItem(config.idKey) || "",
    token: localStorage.getItem(config.tokenKey) || "",
    name: localStorage.getItem(config.nameKey) || "",
    loginPath: config.loginPath,
    homePath: config.homePath,
  };
}

export function hasRoleSession(role) {
  const session = getRoleSession(role);
  return Boolean(session?.id && session?.token);
}

export function getAuthenticatedRole() {
  if (hasRoleSession("admin")) return "admin";
  if (hasRoleSession("propertyOwner")) return "propertyOwner";
  if (hasRoleSession("tourismManager")) return "tourismManager";
  return "";
}

export function getRoleHomePath(role) {
  return getRoleConfig(role)?.homePath || "/";
}

export function getRoleLoginPath(role) {
  return getRoleConfig(role)?.loginPath || "/";
}

export function clearRoleSession(role) {
  const config = getRoleConfig(role);
  if (!config) return;
  config.clearKeys.forEach((key) => localStorage.removeItem(key));
}

export function buildAuthHeaders(role, extraHeaders = {}) {
  const session = getRoleSession(role);
  if (!session?.token) return extraHeaders;

  return {
    ...extraHeaders,
    Authorization: `Bearer ${session.token}`,
  };
}
