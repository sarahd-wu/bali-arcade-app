import { databaseError, pool } from "../../../lib/db";

export async function GET() {
  try {
    const [stats, byType, byFloor] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM mall.floors) AS total_floors,
           (SELECT COUNT(*) FROM mall.stores) AS total_stores,
           (SELECT COUNT(*) FROM mall.stores WHERE status = 'active') AS active_stores,
           (SELECT COUNT(*) FROM mall.stores WHERE status = 'vacant') AS vacant_stores,
           (SELECT COUNT(*) FROM mall.stores WHERE status = 'under-renovation') AS renovation_stores`,
      ),
      pool.query("SELECT type, COUNT(*) FROM mall.stores GROUP BY type"),
      pool.query(
        `SELECT f.floor_name, COUNT(s.id)
         FROM mall.floors f
         LEFT JOIN mall.stores s ON f.id = s.floor_id
         GROUP BY f.id, f.floor_name
         ORDER BY f.floor_number`,
      ),
    ]);
    return Response.json({
      ...stats.rows[0],
      by_type: byType.rows,
      by_floor: byFloor.rows,
    });
  } catch (error) {
    return databaseError(error);
  }
}
