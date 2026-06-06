export const migrations = [
  {
    version: 1,
    name: "initialize-storage-version",
    up: async () => true
  },
  {
    version: 2,
    name: "normalize-project-status",
    up: async (storage) => {
      const keys = await storage.keys("project:");
      for (const key of keys) {
        const project = await storage.getItem(key);
        if (project && !project.status) {
          await storage.setItem(key, { ...project, status: "draft" });
        }
      }
      return true;
    }
  },
  {
    version: 3,
    name: "ensure-project-version-field",
    up: async (storage) => {
      const keys = await storage.keys("project:");
      for (const key of keys) {
        const project = await storage.getItem(key);
        if (project && !project.version) {
          await storage.setItem(key, { ...project, version: 1 });
        }
      }
      return true;
    }
  }
];
