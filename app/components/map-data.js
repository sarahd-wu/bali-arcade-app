export const floorBounds = [[0, 0], [1024, 1440]];

// Shared labels and helpers for map controls and feature data.
export const floorOptions = [
  ["ground", "Ground Floor"],
  ["first", "First Floor"],
  ["2", "Floor 2"],
  ["3", "Floor 3"],
  ["4", "Floor 4"],
  ["5", "Floor 5"],
  ["6", "Floor 6"],
  ["7", "Floor 7"],
  ["8", "Floor 8"],
  ["9", "Floor 9"],
  ["10", "Floor 10"],
];

const categoryIcons = [
  ["childrens-clothing", "Children's Clothing"],
  ["parking", "Parking"],
  ["tech-store", "Tech Store"],
  ["bags-accessories", "Bags & Accessories"],
  ["elevator", "Elevator"],
  ["restroom", "Restroom"],
  ["escalator", "Escalator"],
  ["womens-clothing", "Women's Clothing"],
  ["mens-clothing", "Men's Clothing"],
];

const facilityIcons = [
  ["toilet", "restroom"],
  ["lift", "elevator"],
  ["escalator", "escalator"],
  ["parking", "parking"],
  ["fire exit", "fire-exit"],
];

const categoryAliases = {
  elevator: ["elevator", "lift"],
  lifts: ["elevator", "lift"],
  restroom: ["restroom", "toilet"],
  toilets: ["restroom", "toilet"],
  escalator: ["escalator"],
  escalators: ["escalator"],
  parking: ["parking"],
  "fire exit": ["fire exit"],
  "fire exits": ["fire exit"],
};

// Prefer store IDs for stable keys; facilities use their own feature IDs.
export function featureKey(feature) {
  const { id, store_id: storeId, type, name } = feature.properties || {};
  return String(storeId || `${type || "space"}-${id || name}`);
}

export function storageKey(feature) {
  return feature.properties?.store_id || feature.properties?.id;
}

// Prefer locally saved labels when one exists, then use the database values.
export function featureName(feature, saved) {
  return (
    feature.properties?.name ||
    saved?.name ||
    feature.properties?.store_id ||
    feature.properties?.id ||
    "Unnamed space"
  );
}

export function savedCategory(feature, saved) {
  return (
    saved?.category ||
    feature.properties?.category ||
    feature.properties?.type ||
    "Uncategorized"
  );
}

// Resolve an icon by matching category labels against feature metadata.
export function categoryIcon(feature, saved) {
  const description = [
    saved?.category,
    feature.properties?.category,
    feature.properties?.type,
    featureName(feature, saved),
  ]
    .join(" ")
    .toLowerCase();
  const match = categoryIcons.find(
    ([key, label]) =>
      description.includes(label.toLowerCase()) ||
      description.includes(key.replaceAll("-", " ")),
  );
  return match ? `/icons/${match[0]}.svg` : null;
}

export function facilityIcon(feature, saved) {
  const name = featureName(feature, saved).toLowerCase();
  return facilityIcons.find(([label]) => name.includes(label))?.[1] || null;
}

// Match UI filter labels despite wording differences in the feature data.
export function matchesCategory(feature, label, saved) {
  if (!label) return true;

  const description = [
    saved?.category,
    feature.properties?.category,
    feature.properties?.type,
    featureName(feature, saved),
  ]
    .join(" ")
    .toLowerCase();
  const aliases = categoryAliases[label.toLowerCase()] || [
    label.toLowerCase(),
  ];

  return aliases.some((alias) => description.includes(alias));
}
