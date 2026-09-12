/**
 * Inline SVG icon system using Heroicons paths.
 * Usage: <Icon name="search" size={20} />
 */

const ICONS = {
  // Navigation
  home:       "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  search:     null, // custom below
  menu:       "M4 6h16M4 12h16M4 18h16",
  close:      "M6 18L18 6M6 6l12 12",
  back:       "M19 12H5m0 0l7 7m-7-7l7-7",
  settings:   null,
  chevronDown:"M6 9l6 6 6-6",
  send:       "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",

  // Posts
  lost:       "M9 14l-4-4 4-4m5 8l4-4-4-4",   // diverging arrows → "lost"
  found:      "M5 13l4 4L19 7",                  // checkmark → "found"
  image:      null,
  location:   "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  tag:        "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  clock:      "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  trash:      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  edit:       "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  plus:       "M12 4v16m8-8H4",
  check:      "M5 13l4 4L19 7",
  resolve:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",

  // Exchange
  exchange:   "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
  request:    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  offer:      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",

  // User & Profile
  user:       "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  users:      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
  signout:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  star:       "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",

  // Messages
  chat:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  pin:        "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",

  // Status
  info:       "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  warning:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  error:      "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  success:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

// Icons needing custom paths (not single-path)
const CUSTOM = {
  search: ({ size, cls }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  image: ({ size, cls }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 2 }) {
  const CustomIcon = CUSTOM[name];
  if (CustomIcon) return <CustomIcon size={size} cls={className} />;

  const d = ICONS[name];
  if (!d) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d.includes("M") && d.split("M").length > 3
        ? d.split(/(?=M)/).map((seg, i) => <path key={i} d={`M${seg}`} />)
        : <path d={d} />
      }
    </svg>
  );
}
