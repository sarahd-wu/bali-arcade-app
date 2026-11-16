const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'bali_arcade',
    password: process.env.DB_PASS || process.env.PGPASSWORD,
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
});

async function importData() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const dataPath = path.join(__dirname, 'database', 'ground_floor.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        for (const feature of data.features) {
            const props = feature.properties;

            const query = `
                INSERT INTO mall.stores
                    (store_id, name, type, floor_id, category, status, coordinates)
                VALUES
                    ($1, $2, $3, (SELECT id FROM mall.floors WHERE floor_number = 0), $4, $5, $6)
                ON CONFLICT (store_id) DO UPDATE SET
                    name = CASE WHEN mall.stores.name IS NOT NULL AND mall.stores.name != mall.stores.store_id THEN mall.stores.name ELSE EXCLUDED.name END,
                    type = EXCLUDED.type,
                    floor_id = EXCLUDED.floor_id,
                    category = EXCLUDED.category,
                    status = EXCLUDED.status,
                    coordinates = EXCLUDED.coordinates
                RETURNING id
            `;

            const values = [
                props.id,
                props.name,
                props.type || 'shop',
                props.category || 'retail',
                props.status || 'active',
                JSON.stringify(feature.geometry.coordinates),
            ];

            await client.query(query, values);
            console.log(`✅ Imported: ${props.name}`);
        }

        console.log('✅ All data imported successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

importData();