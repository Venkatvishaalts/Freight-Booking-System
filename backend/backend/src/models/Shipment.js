const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipper_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  carrier_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  vehicle_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  pickup_location: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  delivery_location: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  pickup_latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  pickup_longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  delivery_latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  delivery_longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  freight_type: {
    type: DataTypes.ENUM('electronics', 'food', 'machinery', 'furniture', 'documents', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Weight in kg'
  },
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Format: length x width x height (in cm)'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  scheduled_pickup_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  scheduled_delivery_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  current_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  price_quote: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  special_instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  packaging_type: {
    type: DataTypes.ENUM('standard', 'reusable', 'eco_friendly'),
    defaultValue: 'standard'
  },
  is_circular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if using reusable packaging or participating in backhauling'
  },
  is_shared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  volume_cm3: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  carbon_footprint_estimate: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Estimated CO2 in kg'
  },
  delivered_at: {
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
  tableName: 'shipments',
  timestamps: false,
  indexes: [
    { fields: ['shipper_id'] },
    { fields: ['carrier_id'] },
    { fields: ['current_status'] },
    { fields: ['scheduled_pickup_date'] }
  ]
});

module.exports = Shipment;