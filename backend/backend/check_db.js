const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('./src/config/database');

async function check() {
  try {
    const [results] = await sequelize.query("SELECT conname FROM pg_constraint JOIN pg_class ON pg_class.oid = pg_constraint.conrelid WHERE relname = 'shipments'");
    console.log('Constraints:', results.map(r => r.conname));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
