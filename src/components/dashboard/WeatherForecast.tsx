import React, { useState } from 'react';
import {
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Droplets,
  Wind, Thermometer, Volume2, RefreshCw, Calendar, CheckCircle2,
  AlertTriangle, XCircle, ArrowUpRight, Sparkles, Compass
} from 'lucide-react';
import { WeatherForecastDay, WeatherConditionType, HarvestSuitabilityRating } from '../../types';
import { weatherService, WeatherForecastResponse, WeatherScenario } from '../../services/weatherService';
import { useAccessibility } from '../../hooks/useAccessibility';

interface WeatherForecastProps {
  onPlanActivity?: (activityType: string, date: string, notes: string) => void;
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ onPlanActivity }) => {
  const { speakText } = useAccessibility();
  const [forecast, setForecast] = useState<WeatherForecastResponse>(() => weatherService.getForecast());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedDay = forecast.days[selectedDayIndex] || forecast.days[0];

  const handleRefresh = (scenario?: WeatherScenario) => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = weatherService.refreshForecast(scenario);
      setForecast(updated);
      setIsRefreshing(false);
    }, 400);
  };

  const getWeatherIcon = (cond: WeatherConditionType, className = 'w-5 h-5') => {
    switch (cond) {
      case 'sunny':
        return <Sun className={`${className} text-amber-500`} />;
      case 'partly_cloudy':
        return <CloudSun className={`${className} text-amber-400`} />;
      case 'cloudy':
        return <Cloud className={`${className} text-stone-400`} />;
      case 'rainy':
        return <CloudRain className={`${className} text-blue-500`} />;
      case 'heavy_rain':
        return <CloudRain className={`${className} text-blue-600 stroke-[2.5]`} />;
      case 'thunderstorm':
        return <CloudLightning className={`${className} text-indigo-600`} />;
      default:
        return <CloudSun className={`${className} text-amber-500`} />;
    }
  };

  const getSuitabilityColor = (rating: HarvestSuitabilityRating) => {
    switch (rating) {
      case 'Optimal':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      case 'Caution':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
        };
      case 'Unsuitable':
      default:
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-600',
        };
    }
  };

  const totalWeekRain = forecast.days.reduce((sum, d) => sum + d.rainfallMm, 0);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
      {/* Forecast Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <Sun className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  7-Day Agronomic Weather Forecast
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 hidden xs:inline-block">
                  Mock Weather Service
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                <Compass className="w-3 h-3 text-stone-400" />
                <span>{forecast.locationName}</span>
                <span>· Total Rain: <strong className="text-stone-700">{totalWeekRain.toFixed(1)} mm</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Scenario switch & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <select
            value={forecast.scenario}
            onChange={(e) => handleRefresh(e.target.value as WeatherScenario)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-700 focus:outline-hidden"
            title="Switch weather scenario to test irrigation and harvest decision models"
          >
            <option value="seasonal_mix">Scenario: Seasonal Mix</option>
            <option value="dry_heatwave">Scenario: Arid Heatwave</option>
            <option value="rainy_spell">Scenario: Monsoon Rain</option>
          </select>

          <button
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-600 transition"
            title="Refresh forecast data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Weekly Irrigation & Harvest Advisory Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-sky-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-stone-900">
              Weekly Field Operations Advisory:
            </p>
            <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
              {forecast.summaryRecommendation}
            </p>
          </div>
        </div>

        <button
          onClick={() => speakText(`Weekly weather forecast: ${forecast.summaryRecommendation}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-emerald-900 border border-emerald-300 text-xs font-semibold shrink-0 shadow-xs transition"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Listen Summary</span>
        </button>
      </div>

      {/* 7-Day Horizontal Cards Carousel */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 min-w-[540px]">
          {forecast.days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const suitabilityStyle = getSuitabilityColor(day.harvestSuitability);

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex-1 min-w-[72px] sm:min-w-[80px] p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-white hover:border-stone-300'
                }`}
              >
                {/* Day name */}
                <p className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-stone-800'}`}>
                  {day.dayName}
                </p>
                <p className="text-[10px] text-stone-400">
                  {day.date.slice(5)}
                </p>

                {/* Weather condition icon */}
                <div className="my-2 flex justify-center">
                  {getWeatherIcon(day.condition, 'w-6 h-6')}
                </div>

                {/* Temperature High / Low */}
                <div className="text-xs font-extrabold text-stone-900">
                  {day.tempHigh}°
                </div>
                <div className="text-[11px] text-stone-500">
                  {day.tempLow}°
                </div>

                {/* Rain probability */}
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-medium text-sky-700">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{day.pop}%</span>
                </div>

                {/* Harvest suitability dot */}
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-stone-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${suitabilityStyle.dot}`} />
                  <span className="truncate">{day.harvestSuitability}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detailed Agronomic Plan Card */}
      <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            {getWeatherIcon(selectedDay.condition, 'w-5 h-5')}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  {selectedDay.dayName} ({selectedDay.date}) · {selectedDay.conditionLabel}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    getSuitabilityColor(selectedDay.harvestSuitability).badge
                  }`}
                >
                  Harvest: {selectedDay.harvestSuitability}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              speakText(
                `Forecast for ${selectedDay.dayName}: ${selectedDay.conditionLabel}. High of ${selectedDay.tempHigh} degrees, low of ${selectedDay.tempLow} degrees. ${selectedDay.irrigationAdvice}. Harvest outlook: ${selectedDay.harvestAdvice}`
              )
            }
            className="flex items-center gap-1 text-xs text-emerald-800 font-semibold hover:underline self-end sm:self-center"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Listen Day Forecast</span>
          </button>
        </div>

        {/* Agricultural Microclimate Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Evapotranspiration (ET)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-stone-900">
                {selectedDay.evapotranspirationEt}
              </span>
              <span className="text-[10px] text-stone-500">mm/day</span>
            </div>
            <span className="text-[10px] text-stone-500">
              {selectedDay.evapotranspirationEt > 5 ? 'High plant water loss' : 'Moderate crop demand'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Rainfall Volume
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-sky-700">
                {selectedDay.rainfallMm}
              </span>
              <span className="text-[10px] text-stone-500">mm ({selectedDay.pop}%)</span>
            </div>
            <span className="text-[10px] text-stone-500">
              {selectedDay.rainfallMm > 10 ? 'Heavy precipitation' : selectedDay.rainfallMm > 0 ? 'Light precipitation' : 'No rain expected'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Relative Humidity
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-stone-900">
                {selectedDay.humidity}%
              </span>
              <span className="text-[10px] text-stone-500">RH</span>
            </div>
            <span className="text-[10px] text-stone-500">
              {selectedDay.humidity > 80 ? 'Elevated fungal risk' : 'Normal air dryness'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Wind Speed
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-stone-900">
                {selectedDay.windSpeedKmh}
              </span>
              <span className="text-[10px] text-stone-500">km/h</span>
            </div>
            <span className="text-[10px] text-stone-500">
              {selectedDay.windSpeedKmh > 20 ? 'Breezy; avoid spraying' : 'Safe spray conditions'}
            </span>
          </div>
        </div>

        {/* Recommendations split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Irrigation Plan */}
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <p className="font-bold text-sky-950 flex items-center gap-1.5 mb-1">
              <Droplets className="w-3.5 h-3.5 text-sky-700" />
              Irrigation Scheduling Directive:
            </p>
            <p className="text-sky-900 leading-relaxed text-[11px]">
              {selectedDay.irrigationAdvice}
            </p>
          </div>

          {/* Harvest Plan */}
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
            <p className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              Harvest Suitability Assessment:
            </p>
            <p className="text-amber-900 leading-relaxed text-[11px]">
              {selectedDay.harvestAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
