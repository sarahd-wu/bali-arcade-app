"use client";

import { useEffect, useRef, useState } from "react";
import {
  categoryIcon,
  featureKey,
  facilityIcon,
  savedCategory,
  storageKey,
} from "./map-data";
import { createLeafletMap } from "./leaflet-map";

// React state and map actions used by the rest of the interface.
export default function useMallMap(activeCategory) {
  const mapRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [savedStores, setSavedStores] = useState({});
  const [mapError, setMapError] = useState("");

  // Find the selected feature and its optional browser-local edit.
  const selectedFeature =
    features.find((feature) => featureKey(feature) === selectedKey) || null;
  const selectedSaved = selectedFeature
    ? savedStores[storageKey(selectedFeature)] || null
    : null;

  // Nearby calculations use Leaflet geometry and return only three results.
  const nearbyFeatures = selectedFeature
    ? mapRef.current?.findNearby(selectedFeature, features, savedStores) || []
    : [];

  useEffect(() => {
    if (!window.L) {
      setMapError("Leaflet did not load. Refresh the page to try again.");
      return undefined;
    }

    let active = true;
    // Create Leaflet only in the browser, after React renders the map element.
    const map = createLeafletMap(window.L, selectFeature);
    mapRef.current = map;

    map.load()
      .then((data) => {
        if (!active || !data) return;
        setFeatures(data.features);
        setSavedStores(data.savedStores);
      })
      .catch((error) => {
        if (!active) return;
        setMapError(error.message);
        console.error("Map data could not be loaded:", error);
      });

    return () => {
      active = false;
      map.destroy();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Sync React selection and filters with the Leaflet layers.
    mapRef.current?.updateStyle({
      activeCategory,
      savedStores,
      selectedKey,
    });
  }, [activeCategory, savedStores, selectedKey]);

  function selectFeature(key) {
    const map = mapRef.current;
    const feature = map?.getFeature(key);
    if (!feature) return;

    setSelectedKey(key);
    const id = storageKey(feature);
    setSavedStores((current) =>
      current[id]
        ? current
        : { ...current, [id]: map.getSavedStore(feature) || {} },
    );
    map.panTo(key);
  }

  async function saveStore(feature, store) {
    const properties = feature.properties;
    const id = storageKey(feature) || properties.name;
    const response = await fetch(`/api/stores/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: store.name,
        category: store.category,
        id: properties.id,
        store_number: properties.store_id || properties.name,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    // The API saves text fields; image data stays in browser storage.
    localStorage.setItem(`bali-store-${id}`, JSON.stringify(store));
    setSavedStores((current) => ({ ...current, [id]: store }));
  }

  const iconName = selectedFeature
    ? facilityIcon(selectedFeature, selectedSaved)
    : null;
  const selectedIcon =
    (selectedFeature && categoryIcon(selectedFeature, selectedSaved)) ||
    (iconName ? `/icons/${iconName}.svg` : null);

  return {
    features,
    selectedFeature,
    selectedSaved,
    selectedCategory: selectedFeature
      ? savedCategory(selectedFeature, selectedSaved)
      : "",
    selectedIcon,
    nearbyFeatures,
    savedStores,
    mapError,
    selectFeature,
    clearSelection: () => setSelectedKey(null),
    saveStore,
    centerMap: () => mapRef.current?.center(),
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
  };
}
