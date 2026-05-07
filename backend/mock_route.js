const { Route, Vehicle } = require('./backend/src/models');
async function publish() {
  const v = await Vehicle.findOne({ where: { vehicle_number: 'TN-45-FG-1234' } });
  if (v) {
    await Route.create({
      vehicle_id: v.id,
      source: 'Delhi',
      destination: 'Chennai',
      intermediate_points: ['Agra', 'Nagpur', 'Hyderabad'],
      is_active: true
    });
    console.log('Route created');
  } else {
    console.log('Vehicle not found');
  }
  process.exit(0);
}
publish();
