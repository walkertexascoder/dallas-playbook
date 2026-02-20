const STORAGE_KEY = "dallas-playbook-hidden-seasons";
const CHILDREN_KEY = "dallas-playbook-children";

export interface ChildEntry {
  id: string;
  birthdate: string; // ISO date string YYYY-MM-DD
}

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

// --- Children preferences ---

export function getChildren(): ChildEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CHILDREN_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function setChildren(children: ChildEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
  window.dispatchEvent(new Event("preferences-changed"));
}

export function addChild(birthdate: string): ChildEntry {
  const children = getChildren();
  const entry: ChildEntry = { id: crypto.randomUUID(), birthdate };
  children.push(entry);
  setChildren(children);
  return entry;
}

export function removeChild(id: string) {
  const children = getChildren().filter((c) => c.id !== id);
  setChildren(children);
}
