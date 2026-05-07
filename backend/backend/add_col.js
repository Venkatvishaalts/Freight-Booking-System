const sequelize = require('./src/config/database');
sequelize.query('ALTER TABLE "shipments" ADD COLUMN "vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE').then(()=>console.log('done')).catch(e=>console.log(e.message)).finally(() => process.exit(0));
