const sequelize = require('../backend/src/config/database');

async function fixEnums() {
  try {
    console.log('Starting Enum fix...');
    
    // Add missing values to enum_shipments_current_status
    const statuses = ['picked_up', 'out_for_delivery', 'delivered'];
    for (const status of statuses) {
      try {
        await sequelize.query(`ALTER TYPE enum_shipments_current_status ADD VALUE '${status}'`);
        console.log(`Added ${status} to enum_shipments_current_status`);
      } catch (e) {
        console.log(`${status} might already exist or error: ${e.message}`);
      }
    }

    // Add missing values to enum_tracking_status
    const trackingStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    for (const status of trackingStatuses) {
      try {
        await sequelize.query(`ALTER TYPE enum_tracking_status ADD VALUE '${status}'`);
        console.log(`Added ${status} to enum_tracking_status`);
      } catch (e) {
        console.log(`${status} might already exist or error: ${e.message}`);
      }
    }

    console.log('Enum fix complete!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error fixing enums:', err);
    process.exit(1);
  }
}

fixEnums();
