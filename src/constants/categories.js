// ── Lost & Found categories ─────────────────────────────────
export const LOSTFOUND_CATEGORIES = [
  "ID Card", "Keys", "Wallet", "Phone", "Laptop",
  "Books", "Earphones", "Water Bottle", "Others",
];

// ── Peer Exchange categories ─────────────────────────────────
export const EXCHANGE_CATEGORIES = [
  "Cycle", "Calculator", "Scientific Calculator", "Charger",
  "Power Bank", "Umbrella", "Lab Coat", "Notebook", "Drafter", "Others",
];

// ── Duration options ─────────────────────────────────────────
export const DURATION_OPTIONS = [
  { value: 1,  label: "1 day" },
  { value: 2,  label: "2 days" },
  { value: 3,  label: "3 days" },
  { value: 5,  label: "5 days" },
  { value: 7,  label: "1 week" },
  { value: 14, label: "2 weeks" },
  { value: 30, label: "1 month" },
];

// ── Post type config ─────────────────────────────────────────
export const POST_TYPE_CONFIG = {
  lost: {
    label: "LOST",
    color: "#ef4444",
    bg:    "#fee2e2",
    border:"#fecaca",
    cta:   "I Found This! 🎉",
    ctaColor: "#ef4444",
  },
  found: {
    label: "FOUND",
    color: "#16a34a",
    bg:    "#dcfce7",
    border:"#bbf7d0",
    cta:   "This is Mine! ✋",
    ctaColor: "#16a34a",
  },
  request: {
    label: "NEED",
    color: "#7c3aed",
    bg:    "#ede9fe",
    border:"#ddd6fe",
    cta:   "I Can Lend This 🤝",
    ctaColor: "#7c3aed",
  },
  offer: {
    label: "HAVE",
    color: "#d97706",
    bg:    "#fef3c7",
    border:"#fde68a",
    cta:   "I Need This! 🙋",
    ctaColor: "#d97706",
  },
};

// ── Category icons (shared) ─────────────────────────────────
export const CATEGORY_ICONS = {
  // Lost & Found
  "ID Card":       "🪪",
  "Keys":          "🔑",
  "Wallet":        "👛",
  "Phone":         "📱",
  "Laptop":        "💻",
  "Books":         "📚",
  "Earphones":     "🎧",
  "Water Bottle":  "💧",
  // Exchange
  "Cycle":               "🚲",
  "Calculator":          "🧮",
  "Scientific Calculator":"🔬",
  "Charger":             "🔌",
  "Power Bank":          "🔋",
  "Umbrella":            "☂️",
  "Lab Coat":            "🥼",
  "Notebook":            "📓",
  "Drafter":             "📐",
  // Shared
  "Others":        "📦",
};
