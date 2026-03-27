class CriticalRubanBaseSystem {
  static systemId = null;

  getRoll(message) {
    return null;
  }

  isCritical(roll, message) {
    return false;
  }

  isFumble(roll, message) {
    return false;
  }
}

globalThis.CriticalRubanBaseSystem = CriticalRubanBaseSystem;