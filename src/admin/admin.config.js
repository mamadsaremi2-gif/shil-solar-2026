export const ADMIN_APP_CONFIG = {
  approvalFlow: {
    pendingLabel: 'در انتظار تأیید مدیر',
    rejectedLabel: 'دسترسی شما فعال نیست',
    requireAdminApproval: true,
  },
  sections: {
    users: true,
    projects: true,
    equipmentLibrary: true,
    reports: true,
    analytics: true,
  },
  permissions: {
    adminCanApproveUsers: true,
    adminCanManageEquipment: true,
    adminCanViewProjects: true,
  },
};
