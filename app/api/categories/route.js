import { databaseError, pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT category AS name, COUNT(*) AS store_count
       FROM mall.stores
       GROUP BY category
       ORDER BY category`,
    );
    return Response.json({
      categories: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    return databaseError(error);
  }
}
