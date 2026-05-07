const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  carrier_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  vehicle_type: {
    type: DataTypes.ENUM('bike', 'van', 'truck', 'mini_truck', 'container_truck'),
    allowNull: false
  },
  capacity_kg: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  vehicle_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('available', 'assigned', 'out_for_delivery', 'maintenance', 'inactive'),
    defaultValue: 'available',
  },
  current_shipment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'shipments',
      key: 'id'
    }
  },
  last_delivery_completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_weight_capacity: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Max weight in KG'
  },
  used_weight_capacity: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  capacity_status: {
    type: DataTypes.ENUM('full', 'partial', 'available'),
    defaultValue: 'available',
  },
  driver_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  driver_phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  manufactured_year: {
    type: DataTypes.INTEGER,
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
  tableName: 'vehicles',
  timestamps: false,
  indexes: [
    { fields: ['carrier_id'] },
    { fields: ['status'] }
  ]
});

module.exports = Vehicle;