const sequelize = require('./src/config/database');
sequelize.query('ALTER TABLE "vehicles" RENAME COLUMN "license_plate" TO "vehicle_number"')
  .then(()=>console.log('done'))
  .catch(e=>console.log(e.message))
  .finally(()=>process.exit(0));
