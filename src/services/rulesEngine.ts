import { DecisionRulesConfig, IrrigationAlert, Plot, Crop, SensorReading } from '../types';

export const DEFAULT_RULES_CONFIG: DecisionRulesConfig = {
  criticalMoistureThreshold: 25,
  lowMoistureThreshold: 35,
  highMoistureThreshold: 80,
  highTempThreshold: 35,
  lowTempThreshold: 12,
  highHumidityThreshold: 80,
  harvestDaysAdvanceAlert: 5,
};

/**
 * Evaluates environmental sensor readings and farm data against predefined rules
 * and returns active alerts and agricultural recommendations.
 */
export function evaluateDecisionRules(
  reading: SensorReading,
  plot: Plot,
  crops: Crop[],
  config: DecisionRulesConfig = DEFAULT_RULES_CONFIG
): IrrigationAlert[] {
  const alerts: IrrigationAlert[] = [];
  const associatedCrops = crops.filter(c => c.plotId === plot.id);
  const cropNames = associatedCrops.map(c => c.name).join(', ') || 'Crops';

  // Rule 1: Critical Low Soil Moisture
  if (reading.soilMoisture < config.criticalMoistureThreshold) {
    alerts.push({
      id: `alert-moist-crit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plotId: plot.id,
      cropId: associatedCrops[0]?.id,
      title: '🚨 Critical Low Soil Moisture',
      message: `Soil moisture in ${plot.name} has fallen to ${reading.soilMoisture}%, which is below critical limit (${config.criticalMoistureThreshold}%).`,
      recommendation: `Immediate irrigation required for ${cropNames} to prevent irreversible wilting and yield loss. Activate ${plot.irrigationType} system now.`,
      ruleCode: 'RULE_CRITICAL_LOW_MOISTURE',
      severity: 'critical',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  }
  // Rule 2: Low Soil Moisture (Standard recommendation)
  else if (reading.soilMoisture < config.lowMoistureThreshold) {
    alerts.push({
      id: `alert-moist-low-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plotId: plot.id,
      cropId: associatedCrops[0]?.id,
      title: '💧 Irrigation Recommended',
      message: `Soil moisture level is ${reading.soilMoisture}% (below optimal threshold of ${config.lowMoistureThreshold}%).`,
      recommendation: `Schedule irrigation within 12-24 hours. Best performed during early morning or late evening to minimize evaporation.`,
      ruleCode: 'RULE_LOW_MOISTURE',
      severity: 'warning',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  }

  // Rule 3: High Soil Moisture / Waterlogging
  if (reading.soilMoisture > config.highMoistureThreshold) {
    alerts.push({
      id: `alert-moist-high-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plotId: plot.id,
      cropId: associatedCrops[0]?.id,
      title: '⚠️ Waterlogging Risk Detected',
      message: `Soil moisture is at ${reading.soilMoisture}%, exceeding high threshold (${config.highMoistureThreshold}%).`,
      recommendation: `Cease all irrigation immediately. Inspect field drains and furrows in ${plot.name} to avoid root asphyxiation and rot.`,
      ruleCode: 'RULE_HIGH_MOISTURE',
      severity: 'warning',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  }

  // Rule 4: High Ambient Temperature Stress
  if (reading.temperature >= config.highTempThreshold) {
    alerts.push({
      id: `alert-temp-high-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plotId: plot.id,
      cropId: associatedCrops[0]?.id,
      title: '☀️ Heat Stress Warning',
      message: `Temperature has reached ${reading.temperature}°C (threshold: ${config.highTempThreshold}°C).`,
      recommendation: `High evapotranspiration rate. Avoid mid-day pesticide or fertilizer sprays. Irrigate during cooler hours to protect crop blossoms and seedlings.`,
      ruleCode: 'RULE_HIGH_TEMP',
      severity: 'warning',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  }

  // Rule 5: Low Ambient Temperature
  if (reading.temperature <= config.lowTempThreshold) {
    alerts.push({
      id: `alert-temp-low-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plotId: plot.id,
      cropId: associatedCrops[0]?.id,
      title: '❄️ Cold Stress Advisory',
      message: `Ambient temperature recorded at ${reading.temperature}°C (below ${config.lowTempThreshold}°C).`,
      recommendation: `Monitor sensitive crops for stunted growth. Consider mulch coverage or nursery protection for juvenile plants.`,
      ruleCode: 'RULE_LOW_TEMP',
      severity: 'advisory',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  }

  // Rule 6: High Humidity + Warm Temperature (Fungal / Pest Vulnerability)
  if (reading.humidity >= config.highHumidityThreshold && reading.temperature >= 26) {
    alerts.push({
      id: `alert-pest-risk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plotId: plot.id,
      cropId: associatedCrops[0]?.id,
      title: '🌿 Fungal & Pest Outbreak Advisory',
      message: `High humidity (${reading.humidity}%) combined with warm temperature (${reading.temperature}°C) recorded.`,
      recommendation: `Environment favors fungal spores (blight/mildew) and aphid multiplication. Perform field scouting on ${cropNames} leaves today.`,
      ruleCode: 'RULE_FUNGAL_RISK',
      severity: 'advisory',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Checks approaching harvests
 */
export function evaluateHarvestReminders(crops: Crop[], advanceDays = 5): IrrigationAlert[] {
  const alerts: IrrigationAlert[] = [];
  const now = new Date();

  for (const crop of crops) {
    const harvestDate = new Date(crop.expectedHarvestDate);
    const diffTime = harvestDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= advanceDays) {
      alerts.push({
        id: `alert-harvest-${crop.id}`,
        plotId: crop.plotId,
        cropId: crop.id,
        title: `🌾 Upcoming Harvest: ${crop.name}`,
        message: `${crop.name} (${crop.variety}) is scheduled for harvest in ${diffDays === 0 ? 'today' : diffDays + ' days'} (${crop.expectedHarvestDate}).`,
        recommendation: `Prepare harvesting tools, crates/bags, labor, and arrange transport or buyer logistics.`,
        ruleCode: 'RULE_HARVEST_APPROACHING',
        severity: 'info',
        status: 'active',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return alerts;
}
