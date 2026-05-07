const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('./src/config/database');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        conname as constraint_name, 
        contype as constraint_type,
        pg_get_constraintdef(pg_constraint.oid) as definition
      FROM pg_constraint 
      JOIN pg_class ON pg_class.oid = pg_constraint.conrelid 
      WHERE relname = 'shipments'
    `);
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
