import { featureName } from "./map-data";

// Show the selected space, nearby options, and store actions.
export default function DetailsPanel({
  feature,
  category,
  image,
  floorLabel,
  nearbyFeatures,
  onSelectNearby,
  onClear,
  onEdit,
}) {
  const icon = feature?.icon;

  return (
    <aside className="details-panel" id="details-panel" aria-live="polite">
      <button
        className="close-details"
        id="close-details"
        type="button"
        aria-label="Close details"
        onClick={onClear}
      >
        ×
      </button>
      <div className="details-heading">
        <div className="details-icon" id="details-icon">
          {icon ? <img src={icon} alt="" /> : "⌂"}
        </div>
        <div>
          <h2 id="details-name">{feature ? featureName(feature) : "Select a space"}</h2>
          <p id="details-category">
            {feature ? category : "Explore the map to view details"}
          </p>
        </div>
      </div>
      <span className="floor-pill" id="details-floor">
        {floorLabel}
      </span>
      <div
        className="store-placeholder"
        id="store-image-preview"
        aria-label="Store image placeholder"
      >
        {image ? (
          <img src={image} alt={`Image of ${featureName(feature)}`} />
        ) : (
          <span>No store image available</span>
        )}
      </div>
      <dl className="details-list">
        <div>
          <dt>Floor</dt>
          <dd id="details-floor-value">{floorLabel}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd id="details-category-value">{feature ? category : "-"}</dd>
        </div>
      </dl>
      <div className="nearby-section">
        <h3>Nearby</h3>
        <div id="nearby-list">
          {/* Nearby items select their feature just like clicking the map. */}
          {nearbyFeatures.length ? (
            nearbyFeatures.map((nearby) => (
              <button
                className="nearby-item"
                type="button"
                data-feature-id={nearby.key}
                key={nearby.key}
                onClick={() => onSelectNearby(nearby.key)}
              >
                <span>{nearby.name}</span>
                <span aria-hidden="true">›</span>
              </button>
            ))
          ) : (
            <p className="empty-state">
              {feature
                ? "No nearby spaces available."
                : "Select a store to see nearby spaces."}
            </p>
          )}
        </div>
      </div>
      <div className="details-actions">
        <button
          className="edit-button"
          id="edit-store"
          type="button"
          disabled={!feature}
          onClick={onEdit}
        >
          Edit store
        </button>
      </div>
    </aside>
  );
}
