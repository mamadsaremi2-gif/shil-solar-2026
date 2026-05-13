
export class WorkflowCheckpointService {
  constructor() {
    this.checkpoints = new Map();
  }

  save(projectId, step, data) {
    const key = `${projectId}:${step}`;
    this.checkpoints.set(key, {
      projectId,
      step,
      data,
      savedAt: new Date().toISOString()
    });
    return this.checkpoints.get(key);
  }

  restore(projectId, step) {
    return this.checkpoints.get(`${projectId}:${step}`) || null;
  }
}
