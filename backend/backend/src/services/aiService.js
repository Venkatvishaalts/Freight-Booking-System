const { Shipment, User, Vehicle } = require('../models');
const { Op } = require('sequelize');

/**
 * AIService: Handles predictive analytics and optimization logic
 */
class AIService {
  /**
   * Forecasts demand based on historical shipment data
   * @param {string} location - Pickup or delivery location
   * @returns {Promise<number>} Predicted number of shipments for the next 7 days
   */
  async forecastDemand(location) {
    // In a real scenario, this would call a Python ML model or use a library like brain.js
    // For now, we use a weighted moving average of the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalData = await Shipment.count({
      where: {
        pickup_location: location,
        created_at: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Mock prediction logic: trend analysis
    const dailyAverage = historicalData / 30;
    const predictedTrend = dailyAverage * 1.1; // Predicting a 10% growth
    return Math.round(predictedTrend * 7); // Return weekly forecast
  }

  /**
   * Optimizes backhauling by matching delivered shipments with pending pickups
   * @param {string} carrierId - The carrier looking for a return trip
   * @param {string} currentLocation - Where the carrier is currently
   * @returns {Promise<Array>} List of recommended shipments
   */
  async optimizeBackhaul(carrierId, currentLocation) {
    // Find shipments near the current location that are pending and heading back towards carrier's origin
    const originLocation = await this.getCarrierOrigin(carrierId);

    return await Shipment.findAll({
      where: {
        current_status: 'pending',
        pickup_location: currentLocation,
        delivery_location: { [Op.like]: `%${originLocation}%` }
      },
      limit: 5
    });
  }

  /**
   * Estimates the carbon footprint of a shipment
   * @param {number} weightKg 
   * @param {number} distanceKm 
   * @param {string} vehicleType 
   * @returns {number} Estimated CO2 in kg
   */
  estimateCarbonFootprint(weightKg, distanceKm, vehicleType) {
    const factors = {
      bike: 0.05,
      van: 0.15,
      truck: 0.3,
      lorry: 0.5
    };

    const factor = factors[vehicleType] || 0.3;
    // Simple formula: (weight/1000) * distance * emission_factor
    return (weightKg / 1000) * distanceKm * factor;
  }

  async getCarrierOrigin(carrierId) {
    const user = await User.findByPk(carrierId);
    return user ? user.company_name : ''; // Using company_name as a proxy for origin base
  }

  /**
   * Check if a shipment route (pickup -> destination) matches a vehicle's active route
   * A match is valid if pickup and destination are either source, destination, or in intermediate_points
   */
  matchRoute(vehicleRoute, pickup, destination) {
    let intermediate = vehicleRoute.intermediate_points || [];
    if (typeof intermediate === 'string') {
      try { intermediate = JSON.parse(intermediate); } catch(e) { intermediate = []; }
    }
    
    const allPoints = [
      vehicleRoute.source.toLowerCase(),
      ...intermediate.map(p => p.toLowerCase()),
      vehicleRoute.destination.toLowerCase()
    ];

    const pickupIdx = allPoints.indexOf(pickup.toLowerCase());
    const destIdx = allPoints.indexOf(destination.toLowerCase());

    // Pickup must exist and must be before Destination in the route sequence
    return pickupIdx !== -1 && destIdx !== -1 && pickupIdx < destIdx;
  }
}

module.exports = new AIService();
