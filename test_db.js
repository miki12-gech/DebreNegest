const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    console.log('Connecting to', process.env.DATABASE_URL);
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables:', res.rows.map(r => r.table_name));
    await client.end();
}
main().catch(console.error);
