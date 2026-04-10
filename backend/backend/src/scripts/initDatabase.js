require('dotenv').config();
const sequelize = require('../config/database');
const { syncDatabase } = require('../utils/dbSync');
const { seedDatabase } = require('../utils/seedDatabase');

const initDatabase = async () => {
  try {
    console.log('🚀 Initializing database...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Sync database (create tables)
    await syncDatabase(false); // Set to true to drop and recreate

    // Ask if you want to seed sample data
    const args = process.argv.slice(2);
    if (args.includes('--seed')) {
      await seedDatabase();
    } else {
      console.log('\n💡 Tip: Run with --seed flag to populate sample data');
      console.log('   npm run db:init -- --seed\n');
    }

    console.log('\n✨ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();