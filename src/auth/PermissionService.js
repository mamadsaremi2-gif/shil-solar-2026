import { permissionsForRole, normalizeAccessRole } from "./roles.js";

export class PermissionService {
  constructor(role = "viewer") {
    this.role = normalizeAccessRole(role);
  }

  setRole(role) {
    this.role = normalizeAccessRole(role);
    return this;
  }

  can(permission) {
    return permissionsForRole(this.role).includes(permission);
  }

  assert(permission) {
    if (!this.can(permission)) {
      const error = new Error(`Permission denied: ${permission}`);
      error.code = "PERMISSION_DENIED";
      throw error;
    }
    return true;
  }

  describe() {
    return { role: this.role, permissions: permissionsForRole(this.role) };
  }
}
