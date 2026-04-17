const sequelize = require('../config/database');
const { User, Shipment, Booking, Tracking, Review, Vehicle } = require('../models');

const syncDatabase = async (force = false) => {
  try {
    console.log(' Syncing database...');
    
    // force: true drops existing tables and recreates them
    await sequelize.sync({ force, alter: !force });
    
    console.log(' Database synced successfully');
    return true;
  } catch (error) {
    console.error(' Error syncing database:', error);
    throw error;
  }
};

module.exports = { syncDatabase };