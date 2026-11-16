import { databaseError, pool } from "../../../lib/db";

export async function GET(request) {
  const floor = new URL(request.url).searchParams.get("floor");
  const floorNumber = Number(floor);
  if (floor === null || !Number.isInteger(floorNumber)) {
    return Response.json({ error: "Invalid floor number" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
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
    return Response.json({
      type: "FeatureCollection",
      features: rows.map((store) => ({
        type: "Feature",
        properties: {
          id: store.id,
          store_id: store.store_id,
          name: store.name,
          type: store.type,
          category: store.category,
          status: store.status,
          floor_number: store.floor_number,
          floor_name: store.floor_name,
        },
        geometry: store.geometry,
      })),
    });
  } catch (error) {
    return databaseError(error);
  }
}
