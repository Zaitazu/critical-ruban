function initCriticalRubanSystems() {
  if (globalThis.CriticalRubanSystemRegistry) return;

  const registry = new Map();

  globalThis.CriticalRubanSystemRegistry = {
    register(SystemClass) {
      if (typeof SystemClass !== "function") {
        throw new Error("Critical Ruban | registerSystem attend une classe.");
      }

      const systemId = SystemClass.systemId;
      if (!systemId || typeof systemId !== "string") {
        throw new Error("Critical Ruban | La classe système doit définir static systemId.");
      }

      if (!(SystemClass.prototype instanceof globalThis.CriticalRubanBaseSystem)) {
        throw new Error(`Critical Ruban | "${systemId}" doit étendre CriticalRubanBaseSystem.`);
      }

      registry.set(systemId, SystemClass);
    },

    unregister(systemId) {
      registry.delete(systemId);
    },

    get(systemId = game.system.id) {
      const SystemClass = registry.get(systemId);
      return SystemClass ? new SystemClass() : null;
    },

    has(systemId = game.system.id) {
      return registry.has(systemId);
    },

    list() {
      return Array.from(registry.keys());
    }
  };
}

function exposeCriticalRubanApi() {
  globalThis.CriticalRuban = {
    show: showBannerManually,
    showCritical: (name, color) => showBannerManually({ type: "critical", name, color }),
    showFumble: (name, color) => showBannerManually({ type: "fumble", name, color }),

    BaseSystem: globalThis.CriticalRubanBaseSystem,

    registerSystem: (SystemClass) => globalThis.CriticalRubanSystemRegistry.register(SystemClass),
    unregisterSystem: (systemId) => globalThis.CriticalRubanSystemRegistry.unregister(systemId),
    getSystem: () => globalThis.CriticalRubanSystemRegistry.get(),
    hasSystem: (systemId) => globalThis.CriticalRubanSystemRegistry.has(systemId),
    listSystems: () => globalThis.CriticalRubanSystemRegistry.list()
  };
}