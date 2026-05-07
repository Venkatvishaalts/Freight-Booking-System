const { Vehicle, Shipment } = require('./backend/src/models');

async function fix() {
  const vehicles = await Vehicle.findAll({ where: { status: 'out_for_delivery' } });
  
  for (let v of vehicles) {
    const activeShipmentsCount = await Shipment.count({
      where: {
        vehicle_id: v.id,
        current_status: 'in_transit'
      }
    });

    if (activeShipmentsCount === 0) {
      // If there are no shipments in transit for this vehicle, it should be fully available
      v.status = 'available';
      v.capacity_status = 'available';
      v.used_weight_capacity = 0;
      v.current_shipment_id = null;
      await v.save();
      console.log('Fixed stuck vehicle (fully released):', v.vehicle_number);
    } else {
      // Re-calculate the actual capacity being used by in-transit shipments
      const activeShipments = await Shipment.findAll({
        where: {
          vehicle_id: v.id,
          current_status: 'in_transit'
        }
      });
      
      const totalWeight = activeShipments.reduce((sum, s) => sum + parseFloat(s.weight || 0), 0);
      
      v.used_weight_capacity = totalWeight;
      if (v.total_weight_capacity && totalWeight >= v.total_weight_capacity) {
        v.capacity_status = 'full';
      } else {
        v.capacity_status = 'partial';
      }
      
      await v.save();
      console.log('Fixed capacity for partially active vehicle:', v.vehicle_number, 'to', totalWeight);
    }
  }
  
  console.log('Done fixing vehicle data.');
  process.exit(0);
}

fix();
