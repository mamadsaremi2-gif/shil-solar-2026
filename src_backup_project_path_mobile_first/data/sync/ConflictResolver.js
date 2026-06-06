export class ConflictResolver {
  constructor(strategy = "latest-write-wins") {
    this.strategy = strategy;
  }

  resolve(local, remote) {
    if (!local) return { resolved: remote, strategy: "remote-only" };
    if (!remote) return { resolved: local, strategy: "local-only" };

    if (this.strategy === "local-wins") {
      return { resolved: local, strategy: "local-wins" };
    }

    if (this.strategy === "remote-wins") {
      return { resolved: remote, strategy: "remote-wins" };
    }

    if (this.strategy === "merge-form") {
      return {
        strategy: "merge-form",
        resolved: {
          ...remote,
          ...local,
          form: {
            ...remote.form,
            ...local.form,
            project: { ...remote.form?.project, ...local.form?.project },
            pv: { ...remote.form?.pv, ...local.form?.pv },
            battery: { ...remote.form?.battery, ...local.form?.battery },
            inverter: { ...remote.form?.inverter, ...local.form?.inverter },
            cable: { ...remote.form?.cable, ...local.form?.cable },
            environment: { ...remote.form?.environment, ...local.form?.environment }
          },
          updatedAt: new Date(Math.max(
            new Date(local.updatedAt || 0).getTime(),
            new Date(remote.updatedAt || 0).getTime()
          )).toISOString(),
          version: Math.max(local.version || 1, remote.version || 1) + 1
        }
      };
    }

    const localTime = new Date(local.updatedAt || 0).getTime();
    const remoteTime = new Date(remote.updatedAt || 0).getTime();

    return {
      resolved: localTime >= remoteTime ? local : remote,
      strategy: "latest-write-wins"
    };
  }
}
