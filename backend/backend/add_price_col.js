const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('./src/config/database');

async function update() {
  try {
    console.log('Adding price_per_kg to routes table...');
    await sequelize.query('ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "price_per_kg" DECIMAL(10, 2) DEFAULT 0');
    console.log('Done!');
  } catch (e) {
    console.error('Update failed:', e.message);
  } finally {
    process.exit(0);
  }
}

update();
