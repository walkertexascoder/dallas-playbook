const STORAGE_KEY = "dallas-playbook-hidden-seasons";

export function getHiddenSeasonIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

export function setHiddenSeasonIds(ids: Set<number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  // Dispatch a storage event so other components can react
  window.dispatchEvent(new Event("preferences-changed"));
}

export function toggleSeasonVisibility(id: number): boolean {
  const hidden = getHiddenSeasonIds();
  if (hidden.has(id)) {
    hidden.delete(id);
  } else {
    hidden.add(id);
  }
  setHiddenSeasonIds(hidden);
  return !hidden.has(id); // returns new visibility
}

export function bulkSetVisibility(ids: number[], visible: boolean) {
  const hidden = getHiddenSeasonIds();
  for (const id of ids) {
    if (visible) {
      hidden.delete(id);
    } else {
      hidden.add(id);
    }
  }
  setHiddenSeasonIds(hidden);
}
