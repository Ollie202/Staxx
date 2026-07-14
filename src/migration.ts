import { KEY, OLD_KEY, DARK_KEY, OLD_DARK_KEY, TAB_KEY, OLD_TAB_KEY } from "./constants";

const OLD_HOSTS = new Set(["wins-tracker-app.vercel.app"]);
const TRANSFER_PREFIX = "staxxs-local-migration:";
const CURRENT_URL = "https://staxxs.vercel.app/";

interface MigrationTransfer {
  from: string;
  createdAt: string;
  items: Record<string, string>;
}

function localStorageSnapshot(): Record<string, string> {
  const items: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key);
      if (value !== null) items[key] = value;
    }
  } catch {
    /* ignore storage access errors */
  }
  return items;
}

function pickDataKey(items: Record<string, string>): string | null {
  const preferred = [
    KEY,
    OLD_KEY,
    "moneymade-v2",
    "moneymade-v1",
    "wins-tracker-v1",
    "wins-tracker",
    "earnings-tracker-v1",
    "earnings-tracker",
  ];
  const knownKey = preferred.find((key) => !!items[key]);
  if (knownKey) return knownKey;
  return Object.keys(items).find((key) => looksLikePersistedData(items[key])) || null;
}

function looksLikePersistedData(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as { wins?: unknown; goals?: unknown; sources?: unknown };
    const wins = Array.isArray(parsed.wins) ? parsed.wins : [];
    const hasWinShape = wins.some((item) => {
      const win = item as { month?: unknown; amount?: unknown; project?: unknown };
      return typeof win.month === "string" && typeof win.project === "string" && typeof win.amount === "number";
    });
    return hasWinShape || (wins.length === 0 && !!parsed.goals && typeof parsed.goals === "object") || Array.isArray(parsed.sources);
  } catch {
    return false;
  }
}

function mergeData(existingRaw: string | null, incomingRaw: string): string {
  if (!existingRaw) return incomingRaw;
  try {
    const existing = JSON.parse(existingRaw) as Record<string, unknown>;
    const incoming = JSON.parse(incomingRaw) as Record<string, unknown>;
    const existingWins = Array.isArray(existing.wins) ? existing.wins : [];
    const incomingWins = Array.isArray(incoming.wins) ? incoming.wins : [];
    const seen = new Set<string>();
    const wins = [...incomingWins, ...existingWins].filter((win) => {
      const item = win as { id?: string; year?: number; month?: string; project?: string; amount?: number; source?: string };
      const key = item.id || [item.year, item.month, item.project, item.amount, item.source].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return JSON.stringify({
      ...existing,
      ...incoming,
      wins,
      goals: { ...((existing.goals as object) || {}), ...((incoming.goals as object) || {}) },
      sources: Array.from(new Set([...(Array.isArray(existing.sources) ? existing.sources : []), ...(Array.isArray(incoming.sources) ? incoming.sources : [])])),
      profile: (incoming.profile as object) || (existing.profile as object),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return incomingRaw;
  }
}

function importTransfer(raw: string): boolean {
  if (!raw.startsWith(TRANSFER_PREFIX)) return false;
  try {
    const transfer = JSON.parse(raw.slice(TRANSFER_PREFIX.length)) as MigrationTransfer;
    const dataKey = pickDataKey(transfer.items || {});
    if (!dataKey) {
      window.name = "";
      sessionStorage.setItem("staxxs-migration-empty", transfer.from);
      return false;
    }

    localStorage.setItem(KEY, mergeData(localStorage.getItem(KEY), transfer.items[dataKey]));
    if (transfer.items[DARK_KEY] || transfer.items[OLD_DARK_KEY] || transfer.items["moneymade-dark"]) {
      localStorage.setItem(DARK_KEY, transfer.items[DARK_KEY] || transfer.items[OLD_DARK_KEY] || transfer.items["moneymade-dark"]);
    }
    if (transfer.items[TAB_KEY] || transfer.items[OLD_TAB_KEY]) {
      localStorage.setItem(TAB_KEY, transfer.items[TAB_KEY] || transfer.items[OLD_TAB_KEY]);
    }
    window.name = "";
    history.replaceState(null, "", window.location.pathname + window.location.search);
    sessionStorage.setItem("staxxs-migration-done", transfer.from);
    return true;
  } catch {
    return false;
  }
}

export function migrateOldDomainData(): "imported" | "redirecting" | "idle" {
  const host = window.location.hostname.toLowerCase();
  if (OLD_HOSTS.has(host)) {
    const transfer: MigrationTransfer = {
      from: host,
      createdAt: new Date().toISOString(),
      items: localStorageSnapshot(),
    };
    window.name = TRANSFER_PREFIX + JSON.stringify(transfer);
    window.location.replace(CURRENT_URL);
    return "redirecting";
  }

  if (!OLD_HOSTS.has(host) && importTransfer(window.name || "")) return "imported";
  return "idle";
}

export function consumeMigrationNotice(): string | null {
  try {
    const from = sessionStorage.getItem("staxxs-migration-done");
    if (!from) return null;
    sessionStorage.removeItem("staxxs-migration-done");
    return from;
  } catch {
    return null;
  }
}

export function consumeEmptyMigrationNotice(): string | null {
  try {
    const from = sessionStorage.getItem("staxxs-migration-empty");
    if (!from) return null;
    sessionStorage.removeItem("staxxs-migration-empty");
    return from;
  } catch {
    return null;
  }
}
