const { User, Vehicle, Shipment, Booking, Tracking } = require('../models');
const sequelize = require('../config/database');

async function testFleetFlow() {
  try {
    console.log('🚀 Starting Fleet Management Flow Test...');

    // Sync database to ensure schema matches (preserving existing data)
    console.log('Syncing database schema...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // 1. Setup - Create test users
    console.log('Creating test carrier...');
    const [carrier] = await User.findOrCreate({
      where: { email: 'carrier_test@example.com' },
      defaults: {
        username: 'carrier_test',
        password_hash: 'hashed_password',
        user_type: 'carrier',
        company_name: 'Test Logistics Corp'
      }
    });

    console.log('Creating test shipper...');
    const [shipper] = await User.findOrCreate({
      where: { email: 'shipper_test@example.com' },
      defaults: {
        username: 'shipper_test',
        password_hash: 'hashed_password',
        user_type: 'shipper',
        company_name: 'Test Manufacturing'
      }
    });

    // 2. Carrier adds a vehicle
    console.log('Carrier adding a vehicle...');
    const vehicleNumber = `TEST-${Math.floor(Math.random() * 10000)}`;
    const vehicle = await Vehicle.create({
      carrier_id: carrier.id,
      vehicle_number: vehicleNumber,
      vehicle_type: 'truck',
      capacity_kg: 5000,
      status: 'available',
      driver_name: 'John Doe'
    });
    console.log(`✅ Vehicle created: ${vehicle.vehicle_number} (Status: ${vehicle.status})`);

    // 3. Shipper creates a shipment
    console.log('Shipper creating a shipment...');
    const shipment = await Shipment.create({
      shipper_id: shipper.id,
      pickup_location: 'New York, NY',
      delivery_location: 'Boston, MA',
      freight_type: 'machinery',
      weight: 1200,
      quantity: 1,
      scheduled_pickup_date: new Date(),
      scheduled_delivery_date: new Date(Date.now() + 86400000),
      price_quote: 450.00,
      current_status: 'pending'
    });
    console.log(`✅ Shipment created: ${shipment.id}`);

    // 4. Carrier accepts shipment (Booking)
    console.log('Carrier accepting shipment...');
    const booking = await Booking.create({
      shipment_id: shipment.id,
      carrier_id: carrier.id,
      booking_status: 'accepted'
    });
    console.log('✅ Booking accepted');

    // 5. Carrier assigns vehicle to shipment
    console.log('Carrier assigning vehicle to shipment...');
    
    // Simulate logic from bookingController.assignVehicle
    if (vehicle.status !== 'available') {
        throw new Error('Vehicle not available');
    }

    shipment.vehicle_id = vehicle.id;
    shipment.current_status = 'in_transit';
    await shipment.save();

    vehicle.status = 'out_for_delivery';
    await vehicle.save();

    await Tracking.create({
      shipment_id: shipment.id,
      status: 'in_transit',
      location: 'Warehouse A',
      notes: `Vehicle ${vehicle.vehicle_number} assigned and en route.`,
      timestamp: new Date()
    });

    console.log('✅ Vehicle assigned successfully');
    console.log(`📊 Vehicle Status: ${vehicle.status}`);
    console.log(`📊 Shipment Status: ${shipment.current_status}`);
    console.log(`📊 Assigned Vehicle ID on Shipment: ${shipment.vehicle_id}`);

    // 6. Complete delivery
    console.log('Completing delivery...');
    shipment.current_status = 'delivered';
    await shipment.save();

    booking.booking_status = 'completed';
    await booking.save();

    vehicle.status = 'available';
    await vehicle.save();

    console.log('✅ Delivery completed and vehicle released');
    console.log(`📊 Final Vehicle Status: ${vehicle.status}`);

    console.log('\n🌟 Fleet Management Flow Test Passed! 🌟');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testFleetFlow();
