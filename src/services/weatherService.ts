import { WeatherForecastDay, WeatherConditionType, HarvestSuitabilityRating } from '../types';

const WEATHER_STORAGE_KEY = 'agrismart_weather_forecast_v1';
const WEATHER_SCENARIO_KEY = 'agrismart_weather_scenario_v1';

export type WeatherScenario = 'seasonal_mix' | 'dry_heatwave' | 'rainy_spell';

export interface WeatherForecastResponse {
  locationName: string;
  updatedAt: string;
  scenario: WeatherScenario;
  days: WeatherForecastDay[];
  summaryRecommendation: string;
}

function generateForecastForScenario(scenario: WeatherScenario): WeatherForecastDay[] {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const days: WeatherForecastDay[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[targetDate.getDay()];

    let condition: WeatherConditionType = 'partly_cloudy';
    let conditionLabel = 'Partly Cloudy';
    let tempHigh = 30;
    let tempLow = 20;
    let humidity = 60;
    let pop = 20;
    let rainfallMm = 0;
    let windSpeedKmh = 14;
    let evapotranspirationEt = 4.2;
    let irrigationAdvice = 'Normal scheduled irrigation.';
    let harvestSuitability: HarvestSuitabilityRating = 'Optimal';
    let harvestAdvice = 'Favorable weather for field activities.';

    if (scenario === 'seasonal_mix') {
      if (i === 0) {
        condition = 'partly_cloudy';
        conditionLabel = 'Partly Cloudy';
        tempHigh = 31;
        tempLow = 21;
        humidity = 62;
        pop = 20;
        rainfallMm = 0.5;
        windSpeedKmh = 12;
        evapotranspirationEt = 4.4;
        irrigationAdvice = 'Proceed with scheduled morning drip irrigation cycle.';
        harvestSuitability = 'Optimal';
        harvestAdvice = 'Good window for harvesting tomatoes and matured legumes.';
      } else if (i === 1) {
        condition = 'sunny';
        conditionLabel = 'Sunny & Warm';
        tempHigh = 34;
        tempLow = 23;
        humidity = 48;
        pop = 10;
        rainfallMm = 0;
        windSpeedKmh = 15;
        evapotranspirationEt = 5.6;
        irrigationAdvice = 'High evapotranspiration expected. Irrigate in early dawn to reduce evaporation losses.';
        harvestSuitability = 'Optimal';
        harvestAdvice = 'Excellent sun drying conditions for harvested grains and cassava chips.';
      } else if (i === 2) {
        condition = 'rainy';
        conditionLabel = 'Moderate Showers';
        tempHigh = 26;
        tempLow = 19;
        humidity = 82;
        pop = 80;
        rainfallMm = 14.5;
        windSpeedKmh = 18;
        evapotranspirationEt = 2.1;
        irrigationAdvice = 'Postpone irrigation: 14.5mm rain forecast will sufficiently recharge topsoil moisture.';
        harvestSuitability = 'Unsuitable';
        harvestAdvice = 'Avoid harvesting today; wet soil and moisture create high post-harvest mold risk.';
      } else if (i === 3) {
        condition = 'heavy_rain';
        conditionLabel = 'Heavy Rain & Thunder';
        tempHigh = 24;
        tempLow = 18;
        humidity = 88;
        pop = 90;
        rainfallMm = 28.0;
        windSpeedKmh = 24;
        evapotranspirationEt = 1.4;
        irrigationAdvice = 'Shut off all pumps. Inspect drainage channels in lowland plots to avoid waterlogging.';
        harvestSuitability = 'Unsuitable';
        harvestAdvice = 'Halt all harvesting and mechanical tractor operations due to soil saturation.';
      } else if (i === 4) {
        condition = 'cloudy';
        conditionLabel = 'Overcast & Clearing';
        tempHigh = 27;
        tempLow = 19;
        humidity = 74;
        pop = 30;
        rainfallMm = 1.2;
        windSpeedKmh = 11;
        evapotranspirationEt = 3.2;
        irrigationAdvice = 'Check soil moisture probes. Residual soil moisture should remain adequate.';
        harvestSuitability = 'Caution';
        harvestAdvice = 'Allow morning dew and field standing water to drain before field picking.';
      } else if (i === 5) {
        condition = 'sunny';
        conditionLabel = 'Clear & Mild';
        tempHigh = 30;
        tempLow = 20;
        humidity = 58;
        pop = 10;
        rainfallMm = 0;
        windSpeedKmh = 13;
        evapotranspirationEt = 4.3;
        irrigationAdvice = 'Resume standard drip schedule according to crop growth phase.';
        harvestSuitability = 'Optimal';
        harvestAdvice = 'Clean dry soil surface; prime condition for root and fruit harvesting.';
      } else {
        condition = 'sunny';
        conditionLabel = 'Bright Sun';
        tempHigh = 31;
        tempLow = 21;
        humidity = 55;
        pop = 5;
        rainfallMm = 0;
        windSpeedKmh = 14;
        evapotranspirationEt = 4.7;
        irrigationAdvice = 'Normal maintenance irrigation window.';
        harvestSuitability = 'Optimal';
        harvestAdvice = 'Stable weather outlook for sorting, transport and marketing.';
      }
    } else if (scenario === 'dry_heatwave') {
      condition = i % 2 === 0 ? 'sunny' : 'partly_cloudy';
      conditionLabel = 'Hot & Arid';
      tempHigh = 35 + (i % 3);
      tempLow = 24;
      humidity = 38;
      pop = 5;
      rainfallMm = 0;
      windSpeedKmh = 16;
      evapotranspirationEt = 6.2;
      irrigationAdvice = 'Heatwave alert: High ET (6+ mm). Increase watering volume by 25% and mulch sensitive roots.';
      harvestSuitability = 'Optimal';
      harvestAdvice = 'Dry conditions ideal for harvesting, but pick early morning to prevent heat wilt.';
    } else {
      // rainy_spell
      condition = i % 2 === 0 ? 'rainy' : 'heavy_rain';
      conditionLabel = 'Monsoon Showers';
      tempHigh = 25;
      tempLow = 19;
      humidity = 86;
      pop = 85;
      rainfallMm = 18 + (i * 3);
      windSpeedKmh = 22;
      evapotranspirationEt = 1.8;
      irrigationAdvice = 'Rainfall exceeds crop water demand. Keep irrigation systems deactivated.';
      harvestSuitability = 'Unsuitable';
      harvestAdvice = 'High disease and rotting hazard. Cover harvested produce in sheds.';
    }

    days.push({
      date: dateStr,
      dayName: dayLabel,
      condition,
      conditionLabel,
      tempHigh,
      tempLow,
      humidity,
      pop,
      rainfallMm,
      windSpeedKmh,
      evapotranspirationEt,
      irrigationAdvice,
      harvestSuitability,
      harvestAdvice,
    });
  }

  return days;
}

export class WeatherService {
  private currentScenario: WeatherScenario = 'seasonal_mix';

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(WEATHER_SCENARIO_KEY) as WeatherScenario;
      if (saved) this.currentScenario = saved;
    }
  }

  public getForecast(): WeatherForecastResponse {
    // Check cached forecast
    const cached = this.getCachedForecast();
    if (cached) return cached;

    // Generate fresh
    return this.refreshForecast(this.currentScenario);
  }

  public refreshForecast(scenario = this.currentScenario): WeatherForecastResponse {
    this.currentScenario = scenario;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEATHER_SCENARIO_KEY, scenario);
    }

    const days = generateForecastForScenario(scenario);

    // Summary recommendation based on upcoming week
    const rainyDays = days.filter(d => d.rainfallMm > 5).length;
    let summaryRecommendation = '';
    if (rainyDays >= 2) {
      summaryRecommendation = 'Rainfall expected midweek (~42mm total). Plan to pause drip irrigation on rain days and schedule harvesting for today and tomorrow before soil becomes saturated.';
    } else if (scenario === 'dry_heatwave') {
      summaryRecommendation = 'Extended dry and hot conditions. Ensure irrigation water reservoirs are full and run early morning fertigation cycles to avoid extreme evapotranspiration stress.';
    } else {
      summaryRecommendation = 'Balanced growing conditions across the 7-day outlook. Follow standard soil moisture sensor triggers with optimal windows for harvest operations.';
    }

    const res: WeatherForecastResponse = {
      locationName: 'Green Valley Basin / Highland Agro-Zone',
      updatedAt: new Date().toISOString(),
      scenario,
      days,
      summaryRecommendation,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(res));
    }

    return res;
  }

  private getCachedForecast(): WeatherForecastResponse | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (!raw) return null;
      const parsed: WeatherForecastResponse = JSON.parse(raw);
      // Validate that today's date matches first day
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.days[0]?.date === today) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  public setScenario(scenario: WeatherScenario): WeatherForecastResponse {
    return this.refreshForecast(scenario);
  }

  public getScenario(): WeatherScenario {
    return this.currentScenario;
  }
}

export const weatherService = new WeatherService();
