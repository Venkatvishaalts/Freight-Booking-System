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
    type: DataTypes.ENUM('bike', 'van', 'truck', 'lorry'),
    allowNull: false
  },
  capacity_kg: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  license_plate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('available', 'in_use', 'maintenance'),
    allowNull: false,
    defaultValue: 'available'
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