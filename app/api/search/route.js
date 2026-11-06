import { databaseError, pool } from "../../../lib/db";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const floorValue = params.get("floor");
  if (query.length < 2) {
    return Response.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 },
    );
  }
  const floor = floorValue === null ? null : Number(floorValue);
  if (floorValue !== null && !Number.isInteger(floor)) {
    return Response.json({ error: "Invalid floor number" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT s.*, f.floor_name, f.floor_number
       FROM mall.stores s
       JOIN mall.floors f ON f.id = s.floor_id
       WHERE (s.name ILIKE $1 OR s.store_id ILIKE $1
              OR s.category ILIKE $1 OR s.type ILIKE $1)
         AND ($2::integer IS NULL OR f.floor_number = $2)
       ORDER BY s.name`,
      [`%${query}%`, floor],
    );
    return Response.json({
      query,
      total: result.rows.length,
      results: result.rows,
    });
  } catch (error) {
    return databaseError(error);
  }
}
