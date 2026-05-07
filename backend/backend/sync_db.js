const sequelize = require('./src/config/database');
const models = require('./src/models');

async function syncDB() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database sync completed successfully.");
  } catch (err) {
    console.error("Sync error:", err.message);
    if (err.parent && err.parent.code === '42704') {
      console.log("Constraint didn't exist, ignoring...");
    } else {
      console.error(err);
    }
  }
}

syncDB().finally(() => process.exit(0));
