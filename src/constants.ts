export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_ALIASES = MONTHS.reduce<Record<string, string>>((aliases, month, index) => {
  aliases[month.toLowerCase()] = month;
  aliases[MONTH_ABBREVIATIONS[index].toLowerCase()] = month;
  return aliases;
}, { sept: "September" });

export function normalizeMonth(value: string): string | null {
  return MONTH_ALIASES[value.trim().toLowerCase()] || null;
}

export function monthIndex(value: string): number {
  const month = normalizeMonth(value);
  return month ? MONTHS.indexOf(month) : -1;
}

export const CHART_TYPES = ["Bar", "Line", "Area", "Radar", "Pie"];

export const OTHER_SOURCE = "Other";
export const YEARLY_GOAL_LABEL = "Yearly";

export const DEFAULT_SOURCES = [
  "Bounties", "Ambassadorships", "Content", "Dev", "Web3 Jobs",
  "NFTs", "Predictions", "X Monetization", OTHER_SOURCE,
];

/** localStorage key for the persisted data blob. */
export const KEY = "staxx-v1";
export const DARK_KEY = "staxx-dark";
export const TAB_KEY = "staxx-tab";
