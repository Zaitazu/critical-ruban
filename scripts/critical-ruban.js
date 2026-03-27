Hooks.once("init", () => {
  initCriticalRubanSystems();
  exposeCriticalRubanApi();
  registerNativeCriticalRubanSystems();
});

Hooks.once("ready", () => {
  registerSettings();

  globalThis.__critBannerShown ??= new Set();
  globalThis.__critBannerPending ??= new Map();
  globalThis.__critBannerSlots ??= new Map();
  globalThis.__critBannerManager ??= null;

  Hooks.callAll("critical-ruban:registerSystems", globalThis.CriticalRuban);

  Hooks.on("renderChatMessageHTML", onRenderChatMessageHTML);

  if (game.modules.get("dice-so-nice")?.active) {
    Hooks.on("diceSoNiceRollComplete", onDiceSoNiceRollComplete);
  }
});

function onRenderChatMessageHTML(message) {
  try {
    if (!game.settings.get(MODULE_ID, "enableBanner")) return;
    if (!message?.visible) return;

    const system = globalThis.CriticalRuban?.getSystem();
    if (!system) return;

    const roll = system.getRoll(message);
    if (!roll) return;

    const isCritical = system.isCritical(roll, message);
    const isFumble = system.isFumble(roll, message);

    if (!isCritical && !isFumble) return;
    if (globalThis.__critBannerShown.has(message.id)) return;

    const nom_pj = message.speaker?.alias || game.user?.name || "Inconnu";
    const user = message.author;
    const couleur =
      user?.color?.css ??
      user?.color?.toString?.() ??
      user?.color ??
      "#8b0000";

    const payload = {
      messageId: message.id,
      rollId: roll.id,
      nom_pj,
      couleur,
      type: isCritical ? "critical" : "fumble"
    };

    if (game.modules.get("dice-so-nice")?.active) {
      if (message.id) globalThis.__critBannerPending.set(message.id, payload);
      if (roll.id) globalThis.__critBannerPending.set(roll.id, payload);

      setTimeout(() => {
        const pending =
          globalThis.__critBannerPending.get(message.id) ||
          globalThis.__critBannerPending.get(roll.id);

        if (pending) consumePendingRuban(pending);
      }, 8000);

      return;
    }

    requestAnimationFrame(() => showRubanOnce(payload));
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur dans renderChatMessageHTML :`, err);
  }
}

function onDiceSoNiceRollComplete(id) {
  try {
    const payload = globalThis.__critBannerPending.get(id);
    if (!payload) return;
    consumePendingRuban(payload);
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur dans diceSoNiceRollComplete :`, err);
  }
}

function consumePendingRuban(payload) {
  if (!payload) return;
  if (payload.messageId) globalThis.__critBannerPending.delete(payload.messageId);
  if (payload.rollId) globalThis.__critBannerPending.delete(payload.rollId);
  requestAnimationFrame(() => showRubanOnce(payload));
}

function showRubanOnce({ messageId, nom_pj, couleur, type }) {
  if (messageId && globalThis.__critBannerShown.has(messageId)) return;

  if (messageId) {
    globalThis.__critBannerShown.add(messageId);
    setTimeout(() => globalThis.__critBannerShown.delete(messageId), 10000);
  }

  showRollRuban(nom_pj, couleur, type);
}

function showBannerManually({
  type = "critical",
  name = game.user?.character?.name || game.user?.name || "Inconnu",
  color = game.user?.color?.css ?? game.user?.color?.toString?.() ?? game.user?.color ?? "#8b0000"
} = {}) {
  if (!game.settings.get(MODULE_ID, "enableBanner")) return;
  if (type !== "critical" && type !== "fumble") type = "critical";
  requestAnimationFrame(() => showRollRuban(name, color, type));
}

function showRollRuban(nom_pj, couleur, type = "critical") {
  const manager = getBannerManager();
  if (!manager) {
    console.warn(`${MODULE_ID} | Impossible d'initialiser le BannerManager PIXI.`);
    return;
  }

  const slotIndex = acquireBannerSlot();
  const banner = new CritBanner({
    slotIndex,
    type,
    label: type === "fumble"
      ? game.i18n.localize("critical-ruban.ruban.label.criticalFailure")
      : game.i18n.localize("critical-ruban.ruban.label.criticalSuccess"),
    name: nom_pj,
    color: couleur,
    exitEffect: getExitEffect(type)
  });

  manager.addBanner(banner);
  playRubanSound(type);
}