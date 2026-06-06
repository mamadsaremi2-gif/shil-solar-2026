import { ROLE_PERMISSIONS, ROLES } from "./roles.js";

export class PermissionService {
  constructor(role = ROLES.OWNER) {
    this.role = role;
  }

  setRole(role) {
    this.role = role;
    return this;
  }

  can(permission) {
    return (ROLE_PERMISSIONS[this.role] || []).includes(permission);
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
    return {
      role: this.role,
      permissions: ROLE_PERMISSIONS[this.role] || []
    };
  }
}
