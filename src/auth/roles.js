export const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  OWNER: "owner", // legacy alias retained for existing profiles
  ADMIN: "admin",
  ENGINEER: "engineer",
  REVIEWER: "reviewer",
  VIEWER: "viewer",
  USER: "user",
  GUEST: "guest",
});

export const PERMISSIONS = Object.freeze({
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  CALCULATION_RUN: "calculation:run",
  REPORT_EXPORT: "report:export",
  SETTINGS_UPDATE: "settings:update",
  ADMIN_ACCESS: "admin:access",
  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
  CLOUD_ADMIN: "cloud:admin",
  AUDIT_READ: "audit:read",
  ENGINEERING_RELEASE: "engineering:release",
  SENSITIVE_ACTION: "admin:sensitive-action",
});

const ALL = Object.values(PERMISSIONS);
const ADMIN_BASE = [
  PERMISSIONS.PROJECT_CREATE,
  PERMISSIONS.PROJECT_READ,
  PERMISSIONS.PROJECT_UPDATE,
  PERMISSIONS.PROJECT_DELETE,
  PERMISSIONS.CALCULATION_RUN,
  PERMISSIONS.REPORT_EXPORT,
  PERMISSIONS.SETTINGS_UPDATE,
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.ENGINEERING_RELEASE,
  PERMISSIONS.SENSITIVE_ACTION,
];

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.OWNER]: ALL,
  [ROLES.ADMIN]: [...ADMIN_BASE, PERMISSIONS.CLOUD_ADMIN, PERMISSIONS.ROLE_MANAGE],
  [ROLES.ENGINEER]: [PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_READ, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.CALCULATION_RUN, PERMISSIONS.REPORT_EXPORT],
  [ROLES.REVIEWER]: [PERMISSIONS.PROJECT_READ, PERMISSIONS.CALCULATION_RUN, PERMISSIONS.REPORT_EXPORT],
  [ROLES.VIEWER]: [PERMISSIONS.PROJECT_READ],
  [ROLES.USER]: [PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_READ, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.CALCULATION_RUN, PERMISSIONS.REPORT_EXPORT],
  [ROLES.GUEST]: [PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_READ, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.CALCULATION_RUN],
});

export function normalizeAccessRole(role = ROLES.VIEWER) {
  const normalized = String(role || "").trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "superadmin" || normalized === "super_admin") return ROLES.SUPER_ADMIN;
  if (normalized === ROLES.OWNER) return ROLES.SUPER_ADMIN;
  if (normalized === "expert") return ROLES.ENGINEER;
  return Object.values(ROLES).includes(normalized) ? normalized : ROLES.VIEWER;
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[normalizeAccessRole(role)] || [];
}

export function hasRolePermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}
