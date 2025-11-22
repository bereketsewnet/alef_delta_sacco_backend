import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import config from '../src/core/config.js';

const seedFile = path.resolve(process.cwd(), 'seeds/seed_all.sql');

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length);
}

async function seedAll() {
  const sql = await fs.readFile(seedFile, 'utf8');
  const connection = await mysql.createConnection(config.db);
  try {
    for (const statement of splitStatements(sql)) {
      // eslint-disable-next-line no-await-in-loop
      await connection.query(statement);
    }
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedAll()
    .then(() => {
      console.log('Seed data inserted');
    })
    .catch((error) => {
      console.error('Seed failed', error);
      process.exit(1);
    });
}

