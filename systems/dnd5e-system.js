class CriticalRubanSystemDnd5e extends globalThis.CriticalRubanBaseSystem {
  static systemId = "dnd5e";

  getRoll(message) {
    if (!message?.isRoll || !message?.rolls?.length) return null;

    const roll = message.rolls[0];
    const d20Term = roll?.terms?.find((t) => t?.faces === 20);
    if (!d20Term) return null;

    return roll;
  }

  isCritical(roll, message) {
    return roll?.isCritical === true;
  }

  isFumble(roll, message) {
    return roll?.isFumble === true;
  }
}

function registerNativeCriticalRubanSystems() {
  globalThis.CriticalRubanSystemRegistry.register(CriticalRubanSystemDnd5e);
}