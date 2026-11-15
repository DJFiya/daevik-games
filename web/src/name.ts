const KEY = "player-name";

export function loadName() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // storage blocked: the name is not remembered across visits
  }
}
