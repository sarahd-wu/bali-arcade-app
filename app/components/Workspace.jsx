import DetailsPanel from "./DetailsPanel";

// Combines the map container and controls with the details panel.
export default function Workspace({
  floorLabel,
  selectedFeature,
  selectedCategory,
  selectedImage,
  nearbyFeatures,
  onZoomIn,
  onZoomOut,
  onReset,
  onSelectNearby,
  onClearSelection,
  onEdit,
}) {
  return (
    <section className="workspace">
      <div className="map-layout">
        <section
          className="map-card"
          aria-label="Interactive BALI - ARCADE floor map"
        >
          <div id="map" />
          <div className="map-controls" aria-label="Map controls">
            <button
              id="zoom-in"
              type="button"
              aria-label="Zoom in"
              onClick={onZoomIn}
            >
              +
            </button>
            <button
              id="zoom-out"
              type="button"
              aria-label="Zoom out"
              onClick={onZoomOut}
            >
              −
            </button>
            <button
              id="reset-map"
              type="button"
              aria-label="Reset map"
              onClick={onReset}
            >
              ◯
            </button>
          </div>
        </section>
        <DetailsPanel
          feature={selectedFeature}
          category={selectedCategory}
          image={selectedImage}
          floorLabel={floorLabel}
          nearbyFeatures={nearbyFeatures}
          onSelectNearby={onSelectNearby}
          onClear={onClearSelection}
          onEdit={onEdit}
        />
      </div>
      <div className="location-label">
        <span aria-hidden="true">●</span>
        <strong>BALI - ARCADE</strong>
        <span>|</span>
        <span>{floorLabel}</span>
      </div>
    </section>
  );
}
