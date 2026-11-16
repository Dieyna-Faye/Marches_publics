const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
const { Client } = require('pg');

async function ensurePostgresDatabase() {
  const dialect = process.env.DB_DIALECT || 'sqlite';
  if (dialect !== 'postgres') return;

  const dbName = process.env.DB_NAME || 'marche_publics';
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(`Nom de base de données PostgreSQL invalide : ${dbName}`);
  }

  const baseConnConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  // Essayer d'abord de se connecter directement à la base cible si elle existe déjà
  const directClient = new Client({ ...baseConnConfig, database: dbName });
  try {
    await directClient.connect();
    console.log(`[DB] Connexion réussie à la base PostgreSQL "${dbName}".`);
    await directClient.end();
    return;
  } catch (directErr) {
    try { await directClient.end(); } catch {}
    // 3D000 = base inexistante -> on tente de la créer via la base 'postgres'
    if (directErr.code !== '3D000') {
      throw directErr;
    }
  }

  const client = new Client({
    ...baseConnConfig,
    database: 'postgres',
  });

  await client.connect();
  try {
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[DB] Base PostgreSQL "${dbName}" créée avec succès.`);
    } else {
      console.log(`[DB] Base PostgreSQL "${dbName}" déjà existante.`);
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  ensurePostgresDatabase()
    .then(async () => {
      const { sequelize } = require('../models');
      await sequelize.sync();
      console.log('[DB] Tables synchronisées dans PostgreSQL.');
      await sequelize.close();
    })
    .catch((err) => {
      console.error('[DB] Erreur d\'initialisation PostgreSQL :', err.message);
      process.exitCode = 1;
    });
}

module.exports = { ensurePostgresDatabase };

