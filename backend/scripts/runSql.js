'use strict';

/**
 * Convenience runner so you can apply SQL files without needing the psql CLI:
 *   npm run db:schema   -> database/schema.sql
 *   npm run db:indexes  -> database/indexes.sql
 *   npm run db:seed     -> database/seed.sql
 *   npm run db:setup    -> all three in order
 *
 * It connects using the same .env values as the app.
 */
const fs = require('fs');
const path = require('path');
const { pool, disconnect } = require('../config/db');
const logger = require('../utils/logger');

const files = {
  schema: 'schema.sql',
  indexes: 'indexes.sql',
  seed: 'seed.sql',
};

async function run() {
  const key = process.argv[2];
  if (!key || !files[key]) {
    logger.error(`Usage: node scripts/runSql.js <${Object.keys(files).join('|')}>`);
    process.exit(1);
  }

  const filePath = path.join(__dirname, '..', 'database', files[key]);
  const sql = fs.readFileSync(filePath, 'utf8');

  logger.info(`Applying ${files[key]} ...`);
  const client = await pool.connect();
  try {
    await client.query(sql);
    logger.info(`Done: ${files[key]}`);
  } catch (err) {
    logger.error(`Failed applying ${files[key]}: ${err.message}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await disconnect();
  }
}

run();
