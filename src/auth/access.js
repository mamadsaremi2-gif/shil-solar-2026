import { getCurrentSession } from "./session.js";
import { PERMISSIONS, permissionsForRole, normalizeAccessRole } from "./roles.js";

const LOCAL_ADMIN_DENIED = new Set([
  PERMISSIONS.CLOUD_ADMIN,
  PERMISSIONS.ROLE_MANAGE,
]);

export function getEffectiveAccessRole(session = getCurrentSession()) {
  if (!session) return "viewer";
  if (session.role === "guest") return "guest";
  if (session.role === "admin") return normalizeAccessRole(session.accessRole || "admin");
  return normalizeAccessRole(session.accessRole || session.role || "viewer");
}

export function getEffectivePermissions(session = getCurrentSession()) {
  const role = getEffectiveAccessRole(session);
  const permissions = permissionsForRole(role);
  if (session?.authType !== "local-admin") return permissions;
  return permissions.filter((permission) => !LOCAL_ADMIN_DENIED.has(permission));
}

export function sessionCan(permission, session = getCurrentSession()) {
  return getEffectivePermissions(session).includes(permission);
}

export function assertSessionPermission(permission, session = getCurrentSession()) {
  if (!sessionCan(permission, session)) {
    const error = new Error("شما مجوز انجام این عملیات را ندارید.");
    error.code = "PERMISSION_DENIED";
    throw error;
  }
  return true;
}

export function isEmergencyLocalAdmin(session = getCurrentSession()) {
  return session?.role === "admin" && session?.authType === "local-admin";
}
