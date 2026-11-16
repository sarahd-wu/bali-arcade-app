import { databaseError, pool } from "../../../../lib/db";

export async function GET(_request, { params }) {
  const { id } = await params;
  try {
    const result = await pool.query(
      `SELECT s.*, f.floor_name
       FROM mall.stores s
       JOIN mall.floors f ON f.id = s.floor_id
       WHERE s.store_id = $1`,
      [id],
    );
    if (!result.rows.length) {
      return Response.json(
        { error: `Store '${id}' not found` },
        { status: 404 },
      );
    }
    return Response.json(result.rows[0]);
  } catch (error) {
    return databaseError(error);
  }
}

async function updateStore(request, id) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() || null : null;
  if (!name) {
    return Response.json(
      { error: "Store name cannot be empty" },
      { status: 400 },
    );
  }

  try {
    const numericId = /^\d+$/.test(id)
      ? Number(id)
      : /^\d+$/.test(String(body.id ?? ""))
        ? Number(body.id)
        : -1;
    const storeNumber = String(body.store_number || id);
    const publicTable = await pool.query(
      "SELECT to_regclass('public.stores') IS NOT NULL AS available",
    );

    let updatedStore = null;
    if (publicTable.rows[0].available) {
      const publicResult = await pool.query(
        `UPDATE public.stores
         SET name = $1, store_type = COALESCE($2, store_type)
         WHERE id = $3 OR store_number = $4 OR store_number = $5
         RETURNING id, store_number, name, store_type`,
        [name, category, numericId, storeNumber, id],
      );
      updatedStore = publicResult.rows[0] ?? null;
    }

    const mallResult = await pool.query(
      `UPDATE mall.stores
       SET name = $1, category = COALESCE($2, category)
       WHERE store_id = $3 OR store_id = $4
       RETURNING id, store_id, name, category`,
      [name, category, id, String(body.store_number || "")],
    );
    updatedStore ??= mallResult.rows[0] ?? null;

    if (!updatedStore) {
      return Response.json({
        success: false,
        message: `Store '${id}' not found in database to update`,
        rowsUpdated: 0,
      });
    }

    return Response.json({
      success: true,
      message: "Store successfully updated in PostgreSQL database",
      store: updatedStore,
      rowsUpdated: 1,
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  return updateStore(request, id);
}

export async function POST(request, { params }) {
  const { id } = await params;
  return updateStore(request, id);
}
