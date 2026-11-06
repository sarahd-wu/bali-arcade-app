"use client";

import { useState } from "react";

const groups = [
  {
    icon: "▢",
    label: "Shops",
    categories: [
      ["childrens-clothing.svg", "Children's Clothing"],
      ["womens-clothing.svg", "Women's Clothing"],
      ["mens-clothing.svg", "Men's Clothing"],
      ["tech-store.svg", "Tech Store"],
      ["bags-accessories.svg", "Bags & Accessories"],
    ],
  },
  {
    icon: "♨",
    label: "Food & Drinks",
    categories: [[null, "Food & Drinks"]],
  },
  {
    icon: "⌁",
    label: "Facilities",
    categories: [
      ["restroom.svg", "Toilets"],
      ["elevator.svg", "Lifts"],
      ["escalator.svg", "Escalators"],
      ["fire-exit.svg", "Fire Exits"],
    ],
  },
];

// Each group owns its expanded state; the parent owns the selected filter.
function SidebarGroup({ icon, label, categories, activeCategory, onCategoryChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="sidebar-group">
      <button
        className="group-toggle"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="nav-icon">{icon}</span>
        {label}
        <span className="group-chevron">{expanded ? "⌃" : "⌄"}</span>
      </button>
      <div className={`group-options${expanded ? "" : " is-collapsed"}`}>
        {/* Clicking the selected category again clears the filter. */}
        {categories.map(([image, category]) => (
          <button
            className={`category-filter${activeCategory === category ? " is-active" : ""}`}
            type="button"
            data-category={category}
            key={category}
            onClick={() =>
              onCategoryChange(activeCategory === category ? null : category)
            }
          >
            {image && <img src={`/icons/${image}`} alt="" />}
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ activeCategory, onCategoryChange }) {
  return (
    <aside className="sidebar" id="sidebar" aria-label="Primary navigation">
      <nav>
        <button className="nav-item is-active" type="button" data-view="map">
          <span className="nav-icon">⌑</span>Map
        </button>
        {/* Group definitions keep category labels and icons together. */}
        {groups.map((group) => (
          <SidebarGroup
            {...group}
            key={group.label}
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
          />
        ))}
      </nav>
    </aside>
  );
}
