export class ProjectIndexService {
  constructor(storage) {
    this.storage = storage;
    this.indexKey = "index:projects";
  }

  async rebuild(projects) {
    const index = {
      byStatus: {},
      byScenario: {},
      byUpdatedDate: {}
    };

    for (const project of projects) {
      const status = project.status || "draft";
      const scenario = project.form?.project?.scenario || "unknown";
      const date = (project.updatedAt || "").slice(0, 10) || "unknown";

      index.byStatus[status] = [...(index.byStatus[status] || []), project.id];
      index.byScenario[scenario] = [...(index.byScenario[scenario] || []), project.id];
      index.byUpdatedDate[date] = [...(index.byUpdatedDate[date] || []), project.id];
    }

    await this.storage.setItem(this.indexKey, index);
    return index;
  }

  async get() {
    return (await this.storage.getItem(this.indexKey)) || { byStatus: {}, byScenario: {}, byUpdatedDate: {} };
  }

  async query({ status, scenario, updatedDate } = {}) {
    const index = await this.get();
    const sets = [];
    if (status) sets.push(new Set(index.byStatus[status] || []));
    if (scenario) sets.push(new Set(index.byScenario[scenario] || []));
    if (updatedDate) sets.push(new Set(index.byUpdatedDate[updatedDate] || []));

    if (!sets.length) {
      return [...new Set(Object.values(index.byStatus).flat())];
    }

    return [...sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))))];
  }
}
