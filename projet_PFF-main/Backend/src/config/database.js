const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: false });

const dialect = process.env.DB_DIALECT || 'sqlite';

const baseConfig = {
  dialect,
  logging: false,
  define: {
    underscored: false,
    freezeTableName: false,
  },
};

let sequelizeConfig;

if (dialect === 'sqlite') {
  const storage = process.env.DB_STORAGE || './data/marches.db';
  const dir = path.dirname(storage);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sequelizeConfig = { ...baseConfig, storage };
} else {
  if (dialect === 'postgres') {
    try {
      const pg = require('pg');
      pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
    } catch {
      // pg pas encore chargé
    }
  }
  sequelizeConfig = {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'marche_publics',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialectOptions:
      dialect === 'postgres'
        ? { ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false }
        : {},
  };
}

module.exports = sequelizeConfig;
