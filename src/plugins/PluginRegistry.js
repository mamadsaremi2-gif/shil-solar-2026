export class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }

  register(plugin) {
    if (!plugin?.id) throw new Error("Plugin must have an id.");
    if (this.plugins.has(plugin.id)) throw new Error(`Plugin already registered: ${plugin.id}`);

    this.plugins.set(plugin.id, plugin);

    for (const [hookName, handler] of Object.entries(plugin.hooks || {})) {
      if (!this.hooks.has(hookName)) this.hooks.set(hookName, []);
      this.hooks.get(hookName).push({ pluginId: plugin.id, handler });
    }

    return plugin;
  }

  unregister(pluginId) {
    this.plugins.delete(pluginId);
    for (const [hookName, handlers] of this.hooks.entries()) {
      this.hooks.set(hookName, handlers.filter((item) => item.pluginId !== pluginId));
    }
  }

  list() {
    return [...this.plugins.values()].map(({ id, name, version, capabilities = [] }) => ({
      id,
      name,
      version,
      capabilities
    }));
  }

  async runHook(hookName, context = {}) {
    const handlers = this.hooks.get(hookName) || [];
    let nextContext = context;
    const results = [];

    for (const { pluginId, handler } of handlers) {
      const result = await handler(nextContext);
      results.push({ pluginId, result });
      if (result && typeof result === "object" && result.context) {
        nextContext = result.context;
      }
    }

    return {
      context: nextContext,
      results
    };
  }
}
