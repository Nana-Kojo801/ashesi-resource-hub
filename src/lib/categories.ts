// Category display order and colors, matching the design system's category
// accent palette. Category is a free string on each resource (see
// src/content/config.ts) — this map is presentation only. A category that
// appears in content but isn't listed here still renders, using the
// fallback color, so new categories never break the build.
export const CATEGORY_ORDER = [
  'Academic & Administration',
  'Library & Academic Support',
  'Career',
  'Support & Wellbeing',
  'Housing',
  'Research & Opportunities',
  'International Programs',
  'AI & Academic Integrity',
  'Offices & People',
  'Emergency',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Academic & Administration': '#CF4A45',
  'Library & Academic Support': '#D97A2B',
  'Career': '#D9A62B',
  'Support & Wellbeing': '#8FA94B',
  'Housing': '#4FA58C',
  'Research & Opportunities': '#4B8DA9',
  'International Programs': '#7E6FB5',
  'AI & Academic Integrity': '#C4577F',
  'Offices & People': '#B08968',
  'Emergency': '#A93C40',
};

const FALLBACK_COLOR = '#6B5F58';

export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] || FALLBACK_COLOR;
}

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sortCategories(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
