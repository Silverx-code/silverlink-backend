const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const baseSchema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
    : [];

  try {
    console.log('Applying schema.sql...');
    await pool.query(baseSchema);
    console.log('Base schema applied.');

    for (const file of migrationFiles) {
      console.log(`Applying migrations/${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`${file} applied.`);
    }

    console.log('All migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
