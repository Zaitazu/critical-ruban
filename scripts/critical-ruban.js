const MODULE_ID = "critical-ruban";

Hooks.once("ready", () => {
  registerSettings();

  globalThis.__critBannerShown ??= new Set();
  globalThis.__critBannerPending ??= new Map();

  Hooks.on("renderChatMessageHTML", onRenderChatMessageHTML);

  if (game.modules.get("dice-so-nice")?.active) {
    Hooks.on("diceSoNiceRollComplete", onDiceSoNiceRollComplete);
  }
});

function registerSettings() {
  game.settings.register(MODULE_ID, "enableBanner", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.enableBanner.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.enableBanner.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "enableSound", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.enableSound.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.enableSound.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "soundVolume", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.soundVolume.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.soundVolume.hint"),
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 100,
      step: 5
    },
    default: 80
  });

  game.settings.register(MODULE_ID, "criticalSoundPath", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.criticalSoundPath.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.criticalSoundPath.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "",
    filePicker: "audio"
  });

  game.settings.register(MODULE_ID, "fumbleSoundPath", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.fumbleSoundPath.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.fumbleSoundPath.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "",
    filePicker: "audio"
  });
}

function onRenderChatMessageHTML(message) {
  try {
    if (!game.settings.get(MODULE_ID, "enableBanner")) return;
    if (!message?.isRoll) return;
    if (!message?.visible) return;

    const roll = message.rolls?.[0];
    if (!roll) return;

    const d20Term = roll.terms?.find((t) => t?.faces === 20);
    if (!d20Term) return;

    const isCritical = roll.isCritical === true;
    const isFumble = roll.isFumble === true;

    if (!isCritical && !isFumble) return;
    if (globalThis.__critBannerShown.has(message.id)) return;

    const nom_pj = message.speaker?.alias || "Inconnu";
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

        if (!pending) return;
        consumePendingRuban(pending);
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

  requestAnimationFrame(() => {
    showRubanOnce(payload);
  });
}

function showRubanOnce({ messageId, nom_pj, couleur, type }) {
  if (messageId && globalThis.__critBannerShown.has(messageId)) return;

  if (messageId) {
    globalThis.__critBannerShown.add(messageId);
    setTimeout(() => globalThis.__critBannerShown.delete(messageId), 10000);
  }

  showRollRuban(nom_pj, couleur, type);
}

function showRollRuban(nom_pj, couleur, type = "critical") {
  const id = "critical-ruban";
  document.getElementById(id)?.remove();

  const isFumble = type === "fumble";
  const isCritical = type === "critical";
  const baseColor = normalizeHexColor(couleur) ?? "#8b0000";

  const mainColor = isFumble
    ? shiftColorTowardRed(baseColor, 0.42, 0.32)
    : baseColor;

  const dark = darkenColor(mainColor, 0.28);
  const darker = darkenColor(mainColor, 0.45);
  const light = lightenColor(mainColor, 0.18);

  const accent = isFumble ? "#c93b32" : "#e3c35a";
  const label = isFumble
    ? game.i18n.localize("CRITICAL_RUBAN.ruban.label.criticalFailure")
    : game.i18n.localize("CRITICAL_RUBAN.ruban.label.criticalSuccess");

  const mainExtraClass = [
    isFumble ? "no-icon broken" : "",
    isCritical ? "golden" : ""
  ].filter(Boolean).join(" ");

  const iconHTML = isFumble
    ? `<img src="modules/${MODULE_ID}/assets/fumble.svg" class="crit-d20" aria-hidden="true">`
    : `<img src="icons/svg/d20.svg" class="crit-d20" aria-hidden="true">`;

  const div = document.createElement("div");
  div.id = id;

  div.innerHTML = `
    <div class="crit-ribbon-wrap crit-enter ${isFumble ? "is-fumble" : "is-critical"}">
      <div class="crit-tail crit-tail-left"></div>

      <div class="crit-main-wrap">
        <div class="crit-fold-under crit-fold-left"></div>
        <div class="crit-fold-under crit-fold-right"></div>

        <div class="crit-main ${mainExtraClass}" style="
          background: linear-gradient(180deg, ${light} 0%, ${mainColor} 48%, ${dark} 100%);
          border-color: ${accent};
        ">
          <div class="crit-shine"></div>
          ${iconHTML}
          <span class="crit-text">${label} : ${nom_pj}</span>
        </div>
      </div>

      <div class="crit-tail crit-tail-right"></div>
    </div>
  `;

  Object.assign(div.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "10000",
    pointerEvents: "none"
  });

  const tails = div.querySelectorAll(".crit-tail");
  tails.forEach((tail) => {
    Object.assign(tail.style, {
      background: `linear-gradient(180deg, ${dark} 0%, ${darker} 100%)`,
      borderTopColor: accent,
      borderBottomColor: accent
    });
  });

  const folds = div.querySelectorAll(".crit-fold-under");
  folds.forEach((fold) => {
    fold.style.background = darker;
  });

  document.body.appendChild(div);
  playRubanSound(type);

  const wrap = div.querySelector(".crit-ribbon-wrap");
  setTimeout(() => {
    wrap.classList.remove("crit-enter");
    wrap.classList.add("crit-exit");
  }, 3000);

  setTimeout(() => div.remove(), 4300);
}

function playRubanSound(type) {
  if (!game.settings.get(MODULE_ID, "enableBanner")) return;
  if (!game.settings.get(MODULE_ID, "enableSound")) return;

  const defaultSrc = `modules/${MODULE_ID}/assets/${type === "fumble" ? "fumble.ogg" : "critical.ogg"}`;
  const customSetting = type === "fumble" ? "fumbleSoundPath" : "criticalSoundPath";
  const customSrc = game.settings.get(MODULE_ID, customSetting)?.trim();
  const src = customSrc || defaultSrc;

  const volumePercent = game.settings.get(MODULE_ID, "soundVolume");
  const volume = volumePercent / 100;

  try {
    foundry.audio.AudioHelper.play(
      { src, volume, autoplay: true, loop: false },
      false
    );
  } catch (err) {
    console.warn(`${MODULE_ID} | Impossible de jouer le son ${src}`, err);
  }
}

function darkenColor(hex, amount = 0.25) {
  if (!hex || typeof hex !== "string") return "#5a0000";

  let color = hex.replace("#", "").trim();
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  if (color.length !== 6) return "#5a0000";

  const num = parseInt(color, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function lightenColor(hex, amount = 0.2) {
  if (!hex || typeof hex !== "string") return "#aa3333";

  let color = hex.replace("#", "").trim();
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  if (color.length !== 6) return "#aa3333";

  const num = parseInt(color, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function normalizeHexColor(color) {
  if (!color || typeof color !== "string") return null;

  let hex = color.trim().replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toLowerCase()}`;
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;

  const value = normalized.slice(1);
  const num = parseInt(value, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function shiftColorTowardRed(hex, redPull = 0.35, darken = 0.25) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#7a1f1f";

  let { r, g, b } = rgb;

  r = r + (210 - r) * redPull;
  g = g * (1 - redPull * 0.55);
  b = b * (1 - redPull * 0.75);

  r = r * (1 - darken);
  g = g * (1 - darken);
  b = b * (1 - darken);

  return rgbToHex(r, g, b);
}