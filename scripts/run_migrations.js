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

export async function runMigrations() {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const connection = await mysql.createConnection(config.db);
  try {
    for (const file of files) {
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Running migration ${file}`);
      await runSql(connection, sql);
    }
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed', error);
      process.exit(1);
    });
}

