"use client";

import { useMemo, useState } from "react";
import MapHeader from "./MapHeader";
import Sidebar from "./Sidebar";
import StoreEditor from "./StoreEditor";
import Workspace from "./Workspace";
import {
  featureKey,
  featureName,
  floorOptions,
  savedCategory,
  storageKey,
} from "./map-data";
import useMallMap from "./useMallMap";

// Connect the page controls and panels to shared map state.
export default function MapExperience() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [floorValue, setFloorValue] = useState("first");
  const [editor, setEditor] = useState(null);
  const map = useMallMap(activeCategory);

  const floorLabel =
    floorOptions.find(([value]) => value === floorValue)?.[1] || "First Floor";

  // Search includes both API features and browser-local edits.
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return map.features
      .flatMap((feature) => {
        const saved = map.savedStores[storageKey(feature)];
        const name = featureName(feature, saved);
        const category = savedCategory(feature, saved);
        const searchText = [name, category, feature.properties?.type]
          .join(" ")
          .toLowerCase();

        return searchText.includes(query)
          ? [{ key: featureKey(feature), name, category }]
          : [];
      })
      .slice(0, 6);
  }, [map.features, map.savedStores, search]);

  function selectSearchResult(key) {
    map.selectFeature(key);
    setSearch("");
  }

  // Keep the editor's starting values fixed while the user edits them.
  function openEditor() {
    const feature = map.selectedFeature;
    if (!feature) return;

    const saved = map.savedStores[storageKey(feature)];
    setEditor({
      feature,
      name: featureName(feature, saved),
      category: savedCategory(feature, saved),
      image: saved?.image || null,
    });
  }

  const selectedFeature = map.selectedFeature
    ? {
        ...map.selectedFeature,
        icon: map.selectedIcon,
        properties: {
          ...map.selectedFeature.properties,
          name: featureName(map.selectedFeature, map.selectedSaved),
        },
      }
    : null;

  return (
    <>
      <MapHeader
        search={search}
        searchResults={searchResults}
        floorValue={floorValue}
        onSearchChange={setSearch}
        onSelectFeature={selectSearchResult}
        onFloorChange={setFloorValue}
        onCenterMap={map.centerMap}
      />
      <main className="app-shell">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <Workspace
          floorLabel={floorLabel}
          selectedFeature={selectedFeature}
          selectedCategory={map.selectedCategory}
          selectedImage={map.selectedSaved?.image}
          nearbyFeatures={map.nearbyFeatures}
          onZoomIn={map.zoomIn}
          onZoomOut={map.zoomOut}
          onReset={map.centerMap}
          onSelectNearby={map.selectFeature}
          onClearSelection={map.clearSelection}
          onEdit={openEditor}
        />
        {map.mapError && (
          <p className="empty-state" role="alert">
            The map could not be loaded: {map.mapError}
          </p>
        )}
      </main>
      <StoreEditor
        feature={editor?.feature || null}
        initialName={editor?.name || ""}
        initialCategory={editor?.category || ""}
        initialImage={editor?.image || null}
        onClose={() => setEditor(null)}
        onSave={map.saveStore}
      />
    </>
  );
}
