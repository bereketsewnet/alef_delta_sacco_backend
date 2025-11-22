import mysql from 'mysql2/promise';
import config from '../src/core/config.js';
import { runMigrations } from './run_migrations.js';

async function dropAllTables() {
  const connection = await mysql.createConnection(config.db);
  try {
    const [rows] = await connection.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [config.db.database]
    );
    for (const row of rows) {
      const tableName = row.table_name || row.TABLE_NAME;
      // eslint-disable-next-line no-await-in-loop
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`Dropped table ${tableName}`);
    }
  } finally {
    await connection.end();
  }
}

async function reset() {
  try {
    await dropAllTables();
  } catch (error) {
    console.error('Failed to drop tables', error);
    process.exit(1);
  }
  await runMigrations();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  reset()
    .then(() => {
      console.log('Database reset complete');
    })
    .catch((error) => {
      console.error('Reset failed', error);
      process.exit(1);
    });
}

