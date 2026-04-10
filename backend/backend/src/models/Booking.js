const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  shipment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'shipments',
      key: 'id'
    }
  },
  carrier_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  booking_status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'completed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_delivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bookings',
  timestamps: false,
  indexes: [
    { fields: ['shipment_id'] },
    { fields: ['carrier_id'] },
    { fields: ['booking_status'] }
  ]
});

module.exports = Booking;