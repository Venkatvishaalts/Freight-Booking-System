const bcrypt = require('bcryptjs');
const { User, Shipment, Booking, Vehicle } = require('../models');

const seedDatabase = async () => {
  try {
    console.log(' Starting database seeding...');

    // Clear existing data (optional)
    await User.destroy({ where: {} });
    await Vehicle.destroy({ where: {} });
    await Shipment.destroy({ where: {} });
    await Booking.destroy({ where: {} });

    // Create sample users
    const shipper1 = await User.create({
      user_type: 'shipper',
      username: 'shipper_1',
      email: 'shipper1@example.com',
      password_hash: 'password123',
      phone: '9876543210',
      company_name: 'FastShip Co.'
    });

    const shipper2 = await User.create({
      user_type: 'shipper',
      username: 'shipper_2',
      email: 'shipper2@example.com',
      password_hash: 'password123',
      phone: '9876543211',
      company_name: 'QuickDeliver Inc.'
    });

    const carrier1 = await User.create({
      user_type: 'carrier',
      username: 'carrier_1',
      email: 'carrier1@example.com',
      password_hash: 'password123',
      phone: '9123456789',
      company_name: 'TransportPro'
    });

    const carrier2 = await User.create({
      user_type: 'carrier',
      username: 'carrier_2',
      email: 'carrier2@example.com',
      password_hash: 'password123',
      phone: '9123456790',
      company_name: 'LogisticsHub'
    });

    const admin = await User.create({
      user_type: 'admin',
      username: 'admin',
      email: 'admin@example.com',
      password_hash: 'admin123',
      phone: '9999999999',
      company_name: 'Admin Panel'
    });

    // Create sample vehicles
    await Vehicle.create({
      carrier_id: carrier1.id,
      vehicle_type: 'truck',
      capacity_kg: 5000,
      license_plate: 'MH01AB1234',
      status: 'available',
      registration_number: 'REG001'
    });

    await Vehicle.create({
      carrier_id: carrier1.id,
      vehicle_type: 'van',
      capacity_kg: 1500,
      license_plate: 'MH01AB1235',
      status: 'available',
      registration_number: 'REG002'
    });

    await Vehicle.create({
      carrier_id: carrier2.id,
      vehicle_type: 'bike',
      capacity_kg: 100,
      license_plate: 'MH01AB1236',
      status: 'in_use',
      registration_number: 'REG003'
    });

    // Create sample shipments
    const shipment1 = await Shipment.create({
      shipper_id: shipper1.id,
      pickup_location: 'Mumbai Central Station',
      delivery_location: 'Bangalore Tech Park',
      pickup_latitude: 19.0760,
      pickup_longitude: 72.8777,
      delivery_latitude: 12.9716,
      delivery_longitude: 77.5946,
      freight_type: 'electronics',
      weight: 150,
      dimensions: '100 x 50 x 50',
      quantity: 20,
      scheduled_pickup_date: new Date('2026-04-15'),
      scheduled_delivery_date: new Date('2026-04-18'),
      current_status: 'pending',
      price_quote: 5000.00,
      description: 'Computer processors and RAM modules'
    });

    const shipment2 = await Shipment.create({
      shipper_id: shipper1.id,
      carrier_id: carrier1.id,
      pickup_location: 'Delhi Port',
      delivery_location: 'Chennai Harbor',
      pickup_latitude: 28.7041,
      pickup_longitude: 77.1025,
      delivery_latitude: 13.1939,
      delivery_longitude: 80.1940,
      freight_type: 'machinery',
      weight: 500,
      dimensions: '200 x 150 x 100',
      quantity: 5,
      scheduled_pickup_date: new Date('2026-04-16'),
      scheduled_delivery_date: new Date('2026-04-20'),
      current_status: 'confirmed',
      price_quote: 8500.00,
      description: 'Industrial machinery parts'
    });

    const shipment3 = await Shipment.create({
      shipper_id: shipper2.id,
      pickup_location: 'Hyderabad Distribution Center',
      delivery_location: 'Pune Warehouse',
      freight_type: 'food',
      weight: 200,
      quantity: 100,
      scheduled_pickup_date: new Date('2026-04-17'),
      scheduled_delivery_date: new Date('2026-04-19'),
      current_status: 'pending',
      price_quote: 3000.00,
      description: 'Food products and beverages'
    });

    // Create sample booking
    await Booking.create({
      shipment_id: shipment1.id,
      carrier_id: carrier1.id,
      booking_status: 'accepted',
      accepted_at: new Date()
    });

    console.log(' Database seeded successfully!');
    console.log('\n Seed Data Created:');
    console.log('   - 2 Shippers');
    console.log('   - 2 Carriers');
    console.log('   - 1 Admin');
    console.log('   - 3 Vehicles');
    console.log('   - 3 Shipments');
    console.log('   - 1 Booking');
  } catch (error) {
    console.error(' Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedDatabase };