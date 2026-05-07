const { Route, Vehicle } = require('./backend/src/models');
Route.findAll({ include: ['assigned_vehicle'] }).then(r => {
  console.log('Routes in DB:');
  r.forEach(x => {
    console.log(JSON.stringify({
      id: x.id,
      vehicle_id: x.vehicle_id,
      source: x.source,
      dest: x.destination,
      intermediate: x.intermediate_points,
      active: x.is_active,
      v_status: x.assigned_vehicle ? x.assigned_vehicle.status : null,
      v_cap_status: x.assigned_vehicle ? x.assigned_vehicle.capacity_status : null,
      v_total: x.assigned_vehicle ? x.assigned_vehicle.total_weight_capacity : null,
      v_used: x.assigned_vehicle ? x.assigned_vehicle.used_weight_capacity : null
    }, null, 2));
  });
  process.exit(0);
});
