export const ROLES = Object.freeze({
  OWNER: "owner",
  ENGINEER: "engineer",
  REVIEWER: "reviewer",
  VIEWER: "viewer"
});

export const PERMISSIONS = Object.freeze({
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  CALCULATION_RUN: "calculation:run",
  REPORT_EXPORT: "report:export",
  SETTINGS_UPDATE: "settings:update"
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ENGINEER]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.CALCULATION_RUN,
    PERMISSIONS.REPORT_EXPORT
  ],
  [ROLES.REVIEWER]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.CALCULATION_RUN,
    PERMISSIONS.REPORT_EXPORT
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.PROJECT_READ
  ]
});
