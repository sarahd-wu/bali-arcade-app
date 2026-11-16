import { databaseError, pool } from "../../../../lib/db";

function isPosition(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function normalizeLineString(coordinates) {
  return Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    coordinates.every(isPosition)
    ? coordinates
    : null;
}

function normalizeRing(coordinates) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 3 ||
    !coordinates.every(isPosition)
  ) {
    return null;
  }

  const ring = [...coordinates];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }
  return ring;
}

function normalizeGeometry(geometry) {
  if (!geometry || typeof geometry !== "object") return null;

  switch (geometry.type) {
    case "Point":
      return isPosition(geometry.coordinates) ? geometry : null;
    case "MultiPoint":
      return Array.isArray(geometry.coordinates) &&
        geometry.coordinates.every(isPosition)
        ? geometry
        : null;
    case "LineString":
      return normalizeLineString(geometry.coordinates) ? geometry : null;
    case "MultiLineString":
      return Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length > 0 &&
        geometry.coordinates.every(normalizeLineString)
        ? geometry
        : null;
    case "Polygon": {
      const { coordinates } = geometry;
      if (!Array.isArray(coordinates) || coordinates.length === 0) return null;

      if (coordinates.every(isPosition)) {
        if (coordinates.length === 2) {
          // Imported fire-exit segments may be mislabeled as two-point polygons.
          return { type: "LineString", coordinates };
        }
        const ring = normalizeRing(coordinates);
        return ring ? { type: "Polygon", coordinates: [ring] } : null;
      }

      const rings = coordinates.map(normalizeRing);
      return rings.every(Boolean) ? { ...geometry, coordinates: rings } : null;
    }
    case "MultiPolygon": {
      if (!Array.isArray(geometry.coordinates) || !geometry.coordinates.length) {
        return null;
      }
      const polygons = geometry.coordinates.map((polygon) =>
        Array.isArray(polygon) ? polygon.map(normalizeRing) : null,
      );
      return polygons.every(
        (polygon) => polygon && polygon.length > 0 && polygon.every(Boolean),
      )
        ? { ...geometry, coordinates: polygons }
        : null;
    }
    case "GeometryCollection": {
      if (!Array.isArray(geometry.geometries)) return null;
      const geometries = geometry.geometries.map(normalizeGeometry);
      return geometries.every(Boolean) ? { ...geometry, geometries } : null;
    }
    default:
      return null;
  }
}

function featureCollection(rows) {
  const rejected = [];
  const features = rows.flatMap((row) => {
    const geometry = normalizeGeometry(row.geometry);
    if (!geometry) {
      rejected.push({ id: row.id, name: row.name });
      return [];
    }

    return [
      {
        type: "Feature",
        properties: {
          id: row.id,
          store_id: row.store_id,
          name: row.name,
          type: row.type,
          category: row.category,
          status: row.status,
          floor_number: row.floor_number,
          floor_name: row.floor_name,
        },
        geometry,
      },
    ];
  });

  if (rejected.length) {
    console.warn("Omitted map features with invalid geometry:", rejected);
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export async function GET(_request, { params }) {
  const { floor } = await params;
  const floorNumber = Number(floor);
  if (!Number.isInteger(floorNumber)) {
    return Response.json({ error: "Invalid floor number" }, { status: 400 });
  }

  try {
    const publicSchema = await pool.query(
      `SELECT to_regclass('public.stores') IS NOT NULL AS has_stores,
              to_regclass('public.map_features') IS NOT NULL AS has_features`,
    );

    if (publicSchema.rows[0].has_stores) {
      // The public schema numbers floors from 1; the API uses mall's 0-based numbers.
      const databaseFloor = floorNumber + 1;
      const stores = await pool.query(
        `SELECT s.id, s.store_number AS store_id, s.name,
                COALESCE(s.store_type, 'retail') AS category,
                'shop' AS type, 'active' AS status,
                f.floor_number - 1 AS floor_number, f.floor_name,
                ST_AsGeoJSON(s.geom)::json AS geometry
         FROM public.stores s
         JOIN public.floors f ON f.id = s.floor_id
         WHERE f.floor_number = $1 AND s.geom IS NOT NULL
         ORDER BY s.id`,
        [databaseFloor],
      );
      let facilityRows = [];
      if (publicSchema.rows[0].has_features) {
        const facilities = await pool.query(
          `SELECT m.id, NULL::text AS store_id, m.name,
                  COALESCE(m.feature_type, 'facility') AS category,
                  m.feature_type AS type, 'active' AS status,
                  f.floor_number - 1 AS floor_number, f.floor_name,
                  ST_AsGeoJSON(m.geom)::json AS geometry
           FROM public.map_features m
           JOIN public.floors f ON f.id = m.floor_id
           WHERE f.floor_number = $1 AND m.geom IS NOT NULL
           ORDER BY m.id`,
          [databaseFloor],
        );
        facilityRows = facilities.rows;
      }
      if (stores.rows.length) {
        return Response.json(
          featureCollection([...stores.rows, ...facilityRows]),
        );
      }
    }

    const mallRows = await pool.query(
      `SELECT s.id, s.store_id, s.name, s.type, s.category, s.status,
              f.floor_number, f.floor_name,
              CASE
                WHEN jsonb_typeof(s.coordinates) = 'object'
                  AND s.coordinates ? 'type' THEN s.coordinates
                ELSE jsonb_build_object(
                  'type', COALESCE(s.coordinates->>'type', 'Polygon'),
                  'coordinates', s.coordinates
                )
              END AS geometry
       FROM mall.stores s
       JOIN mall.floors f ON f.id = s.floor_id
       WHERE f.floor_number = $1
       ORDER BY s.id`,
      [floorNumber],
    );
    return Response.json(featureCollection(mallRows.rows));
  } catch (error) {
    return databaseError(error);
  }
}
