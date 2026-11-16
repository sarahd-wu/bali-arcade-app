import { floorOptions } from "./map-data";

// Header controls report search, floor, and map actions to the parent.
export default function MapHeader({
  search,
  searchResults,
  floorValue,
  onSearchChange,
  onSelectFeature,
  onFloorChange,
  onCenterMap,
}) {
  return (
    <header className="topbar">
      <button
        className="brand"
        type="button"
        aria-label="Center map on BALI - ARCADE"
        onClick={onCenterMap}
      >
        <span className="brand-pin" aria-hidden="true">
          ●
        </span>
        <span>BALI - ARCADE</span>
      </button>
      {/* Search is handled locally instead of submitting a page request. */}
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <span className="search-symbol" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search for shops, rooms, toilets..."
          autoComplete="off"
          aria-label="Search the mall"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((feature) => (
              <button
                className="search-result"
                type="button"
                key={feature.key}
                onClick={() => onSelectFeature(feature.key)}
              >
                {feature.name}
                <br />
                <small>{feature.category || "Space"}</small>
              </button>
            ))}
          </div>
        )}
      </form>
      <div className="header-actions">
        <label className="floor-select-label" htmlFor="floor-select">
          <span className="sr-only">Select floor</span>
          <select
            className="level-button"
            id="floor-select"
            aria-label="Select floor"
            value={floorValue}
            onChange={(event) => onFloorChange(event.target.value)}
          >
            {floorOptions.map(([value, label]) => (
              <option value={value} data-label={label} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="menu-button"
          type="button"
          hidden
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
