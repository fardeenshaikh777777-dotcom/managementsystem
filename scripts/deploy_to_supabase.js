import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from .env if present
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const connectionString = process.env.DATABASE_URL;

async function deployMigrations() {
  console.log('=================================================================');
  console.log('🚀 PUSHING CODE & MIGRATIONS TO REMOTE SUPABASE CLOUD DATABASE');
  console.log('=================================================================');

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env file.');
    console.error('Please configure DATABASE_URL in .env before running db:deploy.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to live PostgreSQL server on Supabase!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  const migrationFiles = [
    '20261015000001_core_schema.sql',
    '20261015000002_automations.sql',
    '20261015000003_seed_data.sql',
    '20261015000004_security_advisor_fixes.sql'
  ];

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`\n⏳ Applying migration: ${file}...`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await client.query(sql);
      console.log(`✅ Successfully applied to Supabase: ${file}`);
    } catch (err) {
      console.error(`❌ Migration failed in ${file}:`);
      console.error(err.message);
      if (err.detail) console.error('Detail:', err.detail);
      await client.end();
      process.exit(1);
    }
  }

  console.log('\n-----------------------------------------------------------------');
  console.log('🔍 VERIFYING CREATED TABLES ON REMOTE SUPABASE');
  console.log('-----------------------------------------------------------------');

  const tablesCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('Tables in live Supabase public schema:');
  tablesCheck.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));

  const counts = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM kitchen_stations) AS stations_count,
      (SELECT COUNT(*) FROM menu_categories) AS categories_count,
      (SELECT COUNT(*) FROM menu_items) AS items_count,
      (SELECT COUNT(*) FROM raw_inventory_items) AS inventory_count,
      (SELECT COUNT(*) FROM recipe_ingredients) AS recipes_count,
      (SELECT COUNT(*) FROM riders) AS riders_count,
      (SELECT COUNT(*) FROM manager_credentials) AS managers_count,
      (SELECT COUNT(*) FROM cash_drawer_sessions) AS sessions_count,
      (SELECT COUNT(*) FROM orders) AS orders_count;
  `);

  console.log('\n📊 SEED DATA VERIFICATION ON SUPABASE:');
  console.log(counts.rows[0]);

  await client.end();
  console.log('\n=================================================================');
  console.log('🎉 ALL CODE, TABLES, TRIGGERS & AUTOMATIONS PUSHED TO SUPABASE WITH 0 ERRORS!');
  console.log('=================================================================');
}

deployMigrations();
