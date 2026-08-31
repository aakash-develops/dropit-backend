/**
 * Vehicle class base rates and cost per KM
 */
const TRUCK_RATES = {
  pickup: { baseFee: 25, perKm: 1.2 },
  van: { baseFee: 35, perKm: 1.5 },
  box_truck: { baseFee: 50, perKm: 2.0 },
  flatbed: { baseFee: 90, perKm: 3.1 },
  reefer: { baseFee: 110, perKm: 3.5 },
  container_trailer: { baseFee: 180, perKm: 4.5 },
};

/**
 * Calculates the minimum allowed floor price for a trip request
 * @param {string} truckType - Type of truck required
 * @param {number} distanceKm - Estimated driving distance in KM
 * @param {number} [weightKg=0] - Total weight of cargo in KG
 * @returns {number} Minimum calculated price
 */
export const calculateBasePrice = (truckType, distanceKm, weightKg = 0) => {
  const rates = TRUCK_RATES[truckType?.toLowerCase()] || TRUCK_RATES.pickup;

  const distanceCost = (distanceKm || 0) * rates.perKm;

  // Add $10 penalty for every 1,000 kg above 1,000 kg
  const excessWeight = Math.max(0, weightKg - 1000);
  const weightCost = (excessWeight / 1000) * 10;

  const totalMinimumPrice = rates.baseFee + distanceCost + weightCost;

  return Math.round(totalMinimumPrice);
};