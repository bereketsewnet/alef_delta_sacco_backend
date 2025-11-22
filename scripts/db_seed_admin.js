import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { v4 as uuid } from 'uuid';
import config from '../src/core/config.js';
import { hashPassword, generateRandomPassword } from '../src/core/utils/password.js';

const templatePath = path.resolve(process.cwd(), 'seeds/seed_admin.sql');
const credentialsPath = path.resolve(process.cwd(), 'scripts/admin_credentials.txt');

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length);
}

async function seedAdmin() {
  const template = await fs.readFile(templatePath, 'utf8');
  const plainPassword = generateRandomPassword(20);
  const passwordHash = await hashPassword(plainPassword);
  const userId = uuid();
  const username = `admin_${Date.now()}`;
  const email = `${username}@sacco.local`;
  const phone = '+251900000000';
  const sql = template
    .replace('{{USER_ID}}', userId)
    .replace('{{USERNAME}}', username)
    .replace('{{PASSWORD_HASH}}', passwordHash)
    .replace('{{EMAIL}}', email)
    .replace('{{PHONE}}', phone);
  const connection = await mysql.createConnection(config.db);
  try {
    for (const statement of splitStatements(sql)) {
      // eslint-disable-next-line no-await-in-loop
      await connection.query(statement);
    }
  } finally {
    await connection.end();
  }
  await fs.writeFile(
    credentialsPath,
    `Username: ${username}\nPassword: ${plainPassword}\nGenerated: ${new Date().toISOString()}\n`,
    { mode: 0o600 }
  );
  console.log(`Admin credentials saved to ${credentialsPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin().catch((error) => {
    console.error('Admin seed failed', error);
    process.exit(1);
  });
}

