import { databaseError, pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT floor_number FROM mall.floors ORDER BY floor_number",
    );
    return Response.json({
      floors: result.rows.map((floor) => floor.floor_number),
      current: "ground",
      count: result.rows.length,
    });
  } catch (error) {
    return databaseError(error);
  }
}
