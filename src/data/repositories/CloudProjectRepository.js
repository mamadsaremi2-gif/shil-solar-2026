export const CloudProjectRepository = {
  isEnabled() {
    return false;
  },
  async list() {
    return [];
  },
  async upsert() {
    return null;
  },
  async remove() {},
};
