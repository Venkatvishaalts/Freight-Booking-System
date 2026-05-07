const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vehicle_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id',
    },
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  intermediate_points: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of stops/cities along the route',
  },
  departure_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estimated_arrival: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'routes',
  timestamps: true,
  underscored: true,
});

module.exports = Route;
