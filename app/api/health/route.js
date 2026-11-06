import { databaseError, pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    return databaseError(error);
  }
}
