import { PermissionService } from "../../src/auth/PermissionService.js";
import { PERMISSIONS, ROLES } from "../../src/auth/roles.js";
import { assert } from "../fixtures.js";

const viewer = new PermissionService(ROLES.VIEWER);
assert(viewer.can(PERMISSIONS.PROJECT_READ) === true, "Viewer should read projects.");
assert(viewer.can(PERMISSIONS.PROJECT_UPDATE) === false, "Viewer should not update projects.");

let denied = false;
try {
  viewer.assert(PERMISSIONS.PROJECT_DELETE);
} catch (error) {
  denied = error.code === "PERMISSION_DENIED";
}
assert(denied === true, "Permission assert should throw denial.");

const owner = new PermissionService(ROLES.OWNER);
assert(owner.can(PERMISSIONS.SETTINGS_UPDATE) === true, "Owner should update settings.");

console.log("permissionService.test passed");
