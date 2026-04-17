// backend/src/scripts/testModels.js
require('dotenv').config();
const { User, Shipment, Booking, Vehicle, Tracking, Review } = require('../models');

const testModels = async () => {
  try {
    console.log(' Testing model associations...\n');

    // Test 1: Get shipper with their shipments
    const shipper = await User.findOne({
      where: { user_type: 'shipper' },
      include: [
        { association: 'shipments_as_shipper', limit: 2 }
      ]
    });
    console.log(' Test 1: Shipper with shipments');
    console.log(`   Found: ${shipper.username} with ${shipper.shipments_as_shipper.length} shipments\n`);

    // Test 2: Get carrier with vehicles
    const carrier = await User.findOne({
      where: { user_type: 'carrier' },
      include: [{ association: 'vehicles', limit: 2 }]
    });
    console.log(' Test 2: Carrier with vehicles');
    console.log(`   Found: ${carrier.company_name} with ${carrier.vehicles.length} vehicles\n`);

    // Test 3: Get shipment with shipper and carrier
    const shipment = await Shipment.findOne({
      include: [
        { association: 'shipper', attributes: ['username', 'company_name'] },
        { association: 'carrier', attributes: ['username', 'company_name'] }
      ]
    });
    console.log(' Test 3: Shipment with shipper & carrier');
    console.log(`   Shipment: ${shipment.pickup_location} → ${shipment.delivery_location}`);
    console.log(`   Shipper: ${shipment.shipper?.company_name || 'N/A'}`);
    console.log(`   Carrier: ${shipment.carrier?.company_name || 'N/A'}\n`);

    // Test 4: Get booking with shipment details
    const booking = await Booking.findOne({
      include: [
        { association: 'shipment' },
        { association: 'carrier', attributes: ['username', 'company_name'] }
      ]
    });
    console.log(' Test 4: Booking with relationships');
    console.log(`   Booking status: ${booking.booking_status}`);
    console.log(`   Carrier: ${booking.carrier.company_name}\n`);

    console.log(' All model associations working correctly!\n');
    process.exit(0);
  } catch (error) {
    console.error(' Error testing models:', error);
    process.exit(1);
  }
};

testModels();