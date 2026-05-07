const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('./src/config/database');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
      WHERE typname = 'enum_shipments_current_status'
    `);
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
