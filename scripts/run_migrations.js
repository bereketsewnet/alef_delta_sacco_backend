import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import config from '../src/core/config.js';

const migrationsDir = path.resolve(process.cwd(), 'migrations');

async function runSql(connection, sql) {
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length);
  for (const statement of statements) {
    // eslint-disable-next-line no-await-in-loop
    await connection.query(statement);
  }
}

async function ensureDatabase() {
  // Connect without database to create it if needed
  const { database, ...dbConfigWithoutDb } = config.db;
  const connection = await mysql.createConnection(dbConfigWithoutDb);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`✅ Database '${database}' exists or was created`);
  } finally {
    await connection.end();
  }
}

export async function runMigrations() {
  console.log('📦 Starting database migrations...');
  console.log(`📁 Migrations directory: ${migrationsDir}`);
  console.log(`🔌 Target database: ${config.db.host}:${config.db.port}/${config.db.database}`);
  
  // Ensure database exists
  await ensureDatabase();
  
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  
  if (files.length === 0) {
    throw new Error(`No SQL migration files found in ${migrationsDir}`);
  }
  
  console.log(`📋 Found ${files.length} migration file(s): ${files.join(', ')}`);
  
  const connection = await mysql.createConnection(config.db);
  try {
    for (const file of files) {
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`▶️  Running migration: ${file}`);
      await runSql(connection, sql);
      console.log(`✅ Completed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error in migration: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

// Only execute when script is run directly (not when imported)
if (process.argv[1] && process.argv[1].includes('run_migrations.js')) {
  runMigrations()
    .then(() => {
      console.log('✅ Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

