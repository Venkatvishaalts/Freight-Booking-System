const User = require('./User');
const Shipment = require('./Shipment');
const Booking = require('./Booking');
const Tracking = require('./Tracking');
const Review = require('./Review');
const Vehicle = require('./Vehicle');

// Define associations
// User relationships
User.hasMany(Shipment, { foreignKey: 'shipper_id', as: 'shipments_as_shipper' });
User.hasMany(Shipment, { foreignKey: 'carrier_id', as: 'shipments_as_carrier' });
User.hasMany(Booking, { foreignKey: 'carrier_id', as: 'bookings' });
User.hasMany(Vehicle, { foreignKey: 'carrier_id', as: 'vehicles' });
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'given_reviews' });
User.hasMany(Review, { foreignKey: 'reviewed_user_id', as: 'received_reviews' });

// Shipment relationships
Shipment.belongsTo(User, { foreignKey: 'shipper_id', as: 'shipper' });
Shipment.belongsTo(User, { foreignKey: 'carrier_id', as: 'carrier' });
Shipment.hasMany(Booking, { foreignKey: 'shipment_id', as: 'bookings' });
Shipment.hasMany(Tracking, { foreignKey: 'shipment_id', as: 'tracking_history' });
Shipment.hasMany(Review, { foreignKey: 'shipment_id', as: 'reviews' });

// Booking relationships
Booking.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });
Booking.belongsTo(User, { foreignKey: 'carrier_id', as: 'carrier' });

// Tracking relationships
Tracking.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// Review relationships
Review.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewed_user_id', as: 'reviewed_user' });

// Vehicle relationships
Vehicle.belongsTo(User, { foreignKey: 'carrier_id', as: 'carrier' });

module.exports = {
  User,
  Shipment,
  Booking,
  Tracking,
  Review,
  Vehicle
};