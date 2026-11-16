import {
  featureName,
  facilityIcon,
  featureKey,
  matchesCategory,
  storageKey,
  floorBounds,
} from "./map-data";

// Keep map rendering and Leaflet event wiring out of the React hook.
const normalStyle = {
  color: "#655d54",
  weight: 1.2,
  opacity: 0.85,
  fillColor: "#f7f1e8",
  fillOpacity: 0.32,
};

const selectedStyle = {
  color: "#9a6c35",
  weight: 2.5,
  opacity: 1,
  fillColor: "#f3d8b5",
  fillOpacity: 0.72,
};

const hoveredStyle = {
  fillColor: "#e8dfcf",
  fillOpacity: 0.65,
  weight: 1.8,
};

function visibleStyle(visible) {
  return {
    ...normalStyle,
    opacity: visible ? normalStyle.opacity : 0.08,
    fillOpacity: visible ? normalStyle.fillOpacity : 0.03,
  };
}

function featureBounds(layer) {
  const bounds = layer.getBounds?.();
  return bounds?.isValid() ? bounds : null;
}

function readLocalEdits(features) {
  const savedStores = {};
  const extraFeatures = [];

  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith("bali-store-")) continue;

    const storeId = key.slice("bali-store-".length);
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
      console.warn(`Ignoring invalid local data for store '${storeId}':`, error);
      continue;
    }

    if (!saved) continue;
    savedStores[storeId] = saved;

    // Restore locally created features only when absent from the API.
    const alreadyLoaded = features.some(
      (feature) => String(storageKey(feature)) === storeId,
    );
    if (saved.feature && !alreadyLoaded) extraFeatures.push(saved.feature);
  }

  return { savedStores, extraFeatures };
}

function addFacilityMarker(leaflet, map, layer, key, iconName, markers) {
  const bounds = featureBounds(layer);
  if (!iconName || !bounds) return;

  markers.set(
    key,
    leaflet
      .marker(bounds.getCenter(), {
        icon: leaflet.divIcon({
          className: "map-feature-icon",
          html: `<img src="/icons/${iconName}.svg" alt="">`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        interactive: false,
        keyboard: false,
      })
      .addTo(map),
  );
}

export function createLeafletMap(leaflet, onSelectFeature) {
  const map = leaflet.map("map", {
    crs: leaflet.CRS.Simple,
    minZoom: -1,
    maxZoom: 2,
    zoomSnap: 0.5,
    zoomControl: false,
  });
  const featureLayers = new Map();
  const markers = new Map();
  let geoJsonLayer = null;
  let disposed = false;
  let view = { activeCategory: null, savedStores: {}, selectedKey: null };
  let featuresByKey = new Map();
  let savedStores = {};

  leaflet.imageOverlay("/first_floor.png", floorBounds).addTo(map);
  map.fitBounds(floorBounds);

  function styleFeature(feature, key) {
    if (key === view.selectedKey) return selectedStyle;
    return visibleStyle(
      matchesCategory(
        feature,
        view.activeCategory,
        view.savedStores[storageKey(feature)],
      ),
    );
  }

  function updateStyle(nextView) {
    view = nextView;
    geoJsonLayer?.eachLayer((layer) => {
      const key = featureKey(layer.feature);
      const visible = matchesCategory(
        layer.feature,
        view.activeCategory,
        view.savedStores[storageKey(layer.feature)],
      );
      layer.setStyle?.(styleFeature(layer.feature, key));
      markers.get(key)?.setOpacity(visible ? 1 : 0.08);
    });
  }

  async function load() {
    const response = await fetch("/api/map/0");
    if (!response.ok) {
      throw new Error(`Map request failed (${response.status})`);
    }

    const data = await response.json();
    const local = readLocalEdits(data.features || []);
    const features = [...(data.features || []), ...local.extraFeatures];
    if (disposed) return null;

    savedStores = local.savedStores;
    featuresByKey = new Map(features.map((feature) => [featureKey(feature), feature]));
    view = { ...view, savedStores };

    geoJsonLayer = leaflet
      .geoJSON({ ...data, features }, {
        pointToLayer: (_feature, latlng) =>
          leaflet.circleMarker(latlng, {
            radius: 8,
            color: "#655d54",
            fillColor: "#f7f1e8",
            fillOpacity: 0.8,
          }),
        style: () => normalStyle,
        onEachFeature: (feature, layer) => {
          const key = featureKey(feature);
          featureLayers.set(key, layer);
          addFacilityMarker(
            leaflet,
            map,
            layer,
            key,
            facilityIcon(feature, savedStores[storageKey(feature)]),
            markers,
          );
          // Map clicks update React's selected-feature state.
          layer.on({
            mouseover: () => {
              if (key !== view.selectedKey) layer.setStyle?.(hoveredStyle);
            },
            mouseout: () => {
              if (key !== view.selectedKey) {
                layer.setStyle?.(styleFeature(feature, key));
              }
            },
            click: () => onSelectFeature(key),
          });
        },
      })
      .addTo(map);

    updateStyle(view);
    return { features, savedStores };
  }

  function findNearby(selectedFeature, features, saved) {
    const selectedLayer = featureLayers.get(featureKey(selectedFeature));
    const selectedBounds = selectedLayer && featureBounds(selectedLayer);
    if (!selectedBounds) return [];

    const origin = selectedBounds.getCenter();
    return features
      .filter((feature) => featureKey(feature) !== featureKey(selectedFeature))
      .map((feature) => {
        const layer = featureLayers.get(featureKey(feature));
        const bounds = layer && featureBounds(layer);
        if (!bounds) return null;

        return {
          key: featureKey(feature),
          name: featureName(feature, saved[storageKey(feature)]),
          distance: origin.distanceTo(bounds.getCenter()),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 3);
  }

  return {
    load,
    updateStyle,
    findNearby,
    getFeature: (key) => featuresByKey.get(key),
    getSavedStore: (feature) => savedStores[storageKey(feature)],
    panTo: (key) => {
      const bounds = featureBounds(featureLayers.get(key));
      if (bounds) map.panTo(bounds.getCenter(), { animate: true });
    },
    center: () => map.fitBounds(floorBounds),
    zoomIn: () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
    destroy: () => {
      disposed = true;
      featureLayers.clear();
      markers.clear();
      featuresByKey.clear();
      map.remove();
    },
  };
}
