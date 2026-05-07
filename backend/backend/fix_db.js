const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('./src/config/database');

async function fix() {
  try {
    console.log('Attempting manual drop of shipments_carrier_id_fkey...');
    await sequelize.query('ALTER TABLE "shipments" DROP CONSTRAINT IF EXISTS "shipments_carrier_id_fkey"');
    console.log('Done (or skipped if not exists)');
  } catch (e) {
    console.error('Error during manual drop:', e.message);
  } finally {
    process.exit(0);
  }
}

fix();
