const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    console.log('Creating vector extension...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('Done.');
    await client.end();
}
main().catch(console.error);
