const { Shipment, Vehicle } = require('./backend/src/models');
Shipment.findAll().then(s => console.log('Shipments:', JSON.stringify(s.map(x=>({id:x.id, status:x.current_status, v_id:x.vehicle_id})), null, 2)))
.then(() => Vehicle.findAll())
.then(v => {
  console.log('Vehicles:', JSON.stringify(v.map(x=>({id:x.id, vnum:x.vehicle_number, status:x.status, used_cap:x.used_weight_capacity, curr_ship:x.current_shipment_id})), null, 2));
  process.exit(0);
});
