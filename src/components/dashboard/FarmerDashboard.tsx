import React, { useState } from 'react';
import {
  Droplets, Thermometer, Wind, CloudRain, AlertTriangle, CheckCircle,
  Plus, Calendar, ArrowRight, Volume2, ShieldCheck, Check, Clock, ChevronRight,
  TrendingDown, TrendingUp, QrCode, MapPin, UserPlus, Layers, Sprout
} from 'lucide-react';
import {
  Farm, Plot, Crop, SensorReading, IrrigationAlert, FarmActivity
} from '../../types';
import { useAccessibility } from '../../hooks/useAccessibility';
import { WeatherForecast } from './WeatherForecast';

interface FarmerDashboardProps {
  farms: Farm[];
  plots: Plot[];
  crops: Crop[];
  readings: SensorReading[];
  alerts: IrrigationAlert[];
  activities: FarmActivity[];
  onOpenRecordReading: () => void;
  onOpenScheduleActivity: () => void;
  onOpenLogHarvest: () => void;
  onOpenPestReport: () => void;
  onOpenQRScanner?: () => void;
  onOpenRegisterModal?: () => void;
  onSelectPlot: (plotId: string) => void;
  onToggleActivityStatus: (activityId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  farms,
  plots,
  crops,
  readings,
  alerts,
  activities,
  onOpenRecordReading,
  onOpenScheduleActivity,
  onOpenLogHarvest,
  onOpenPestReport,
  onOpenQRScanner,
  onOpenRegisterModal,
  onSelectPlot,
  onToggleActivityStatus,
  onAcknowledgeAlert,
  onNavigateToTab,
}) => {
  const { speakText } = useAccessibility();
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  
  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const farmPlots = plots.filter((p) => !currentFarm || p.farmId === currentFarm.id);
  const activePlotList = farmPlots.length > 0 ? farmPlots : plots;

  const [selectedPlotId, setSelectedPlotId] = useState<string>(activePlotList[0]?.id || '');

  // Keep plot valid when farm changes
  const activePlot = activePlotList.find((p) => p.id === selectedPlotId) || activePlotList[0];
  const plotCrops = crops.filter((c) => c.plotId === activePlot?.id);

  // Latest reading for active plot
  const latestReading = readings.find((r) => r.plotId === activePlot?.id) || readings[0];

  // Active alerts for this plot or system
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalOrWarningAlert = activeAlerts.find(
    (a) => a.plotId === activePlot?.id || a.severity === 'critical'
  ) || activeAlerts[0];

  // Upcoming pending activities
  const pendingActivities = activities
    .filter((a) => a.status !== 'Completed')
    .slice(0, 4);

  const getMoistureStatus = (val?: number) => {
    if (val === undefined) return { text: 'No Data', color: 'text-stone-500', bg: 'bg-stone-100', border: 'border-stone-300' };
    if (val < 25) return { text: 'Critically Dry', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300' };
    if (val < 35) return { text: 'Low Moisture', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' };
    if (val > 80) return { text: 'Waterlogged', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300' };
    return { text: 'Optimal Moisture', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' };
  };

  const moistStatus = getMoistureStatus(latestReading?.soilMoisture);

  return (
    <div className="space-y-5 pb-16">
      {/* Welcome Banner & Farm Selection */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                Smart Agriculture Monitor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700/60 text-emerald-100 border border-emerald-500/30">
                Rule-Based Engine Active
              </span>
              {currentFarm && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-600/40 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-300" />
                  {currentFarm.location || 'Registered Site'}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-bold mt-1 text-white flex items-center gap-2">
              <span>{currentFarm?.name || 'My Agricultural Farm'}</span>
              {farms.length > 1 && (
                <select
                  value={selectedFarmId}
                  onChange={(e) => {
                    setSelectedFarmId(e.target.value);
                    const newF = farms.find(f => f.id === e.target.value);
                    const newPlots = plots.filter(p => !newF || p.farmId === newF.id);
                    if (newPlots[0]) setSelectedPlotId(newPlots[0].id);
                  }}
                  className="text-xs bg-emerald-950/70 border border-emerald-500/50 rounded-lg px-2 py-1 text-white font-normal"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      Switch: {f.name}
                    </option>
                  ))}
                </select>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
              {currentFarm?.totalArea ? `${currentFarm.totalArea} ${currentFarm.areaUnit || 'acres'}` : 'Site Area'} · {activePlotList.length} Active Plots · {plotCrops.length} Crops Monitored
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Register New Farmer / Site Button */}
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-xs transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>+ Register Farmer / Site</span>
              </button>
            )}

            {/* Plot switcher selector */}
            <div className="bg-emerald-950/50 backdrop-blur-xs p-2 rounded-xl border border-emerald-700/40 min-w-[180px]">
              <label className="block text-[11px] font-medium text-emerald-200 mb-1">
                Select Monitored Plot:
              </label>
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full bg-emerald-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-emerald-600 focus:outline-hidden"
              >
                {activePlotList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.soilType})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Predefined Decision Support Callout (Rule Evaluation) */}
      {criticalOrWarningAlert && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border-l-4 border-l-amber-500 border border-stone-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    {criticalOrWarningAlert.title}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Decision Rule: {criticalOrWarningAlert.ruleCode}
                  </span>
                </div>
                <p className="text-xs text-stone-700 mt-1 font-medium">
                  {criticalOrWarningAlert.message}
                </p>
                <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 mt-2">
                  <strong className="text-emerald-950">System Recommendation: </strong>
                  {criticalOrWarningAlert.recommendation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() =>
                  speakText(
                    `${criticalOrWarningAlert.title}. ${criticalOrWarningAlert.message}. System recommendation: ${criticalOrWarningAlert.recommendation}`
                  )
                }
                title="Read recommendation aloud"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Listen Audio</span>
              </button>
              <button
                onClick={() => onAcknowledgeAlert(criticalOrWarningAlert.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Environmental Live Conditions Grid for Active Plot */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-emerald-700" />
            <span>Environmental Conditions: {activePlot?.name}</span>
          </h3>
          <span className="text-xs text-stone-500">
            Recorded {latestReading ? new Date(latestReading.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Soil Moisture */}
          <div className={`p-4 rounded-2xl border ${moistStatus.border} ${moistStatus.bg} transition-all`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Soil Moisture
              </span>
              <Droplets className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {latestReading?.soilMoisture ?? '--'}%
              </span>
              <span className="text-xs text-stone-500 font-medium">volumetric</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={`font-semibold ${moistStatus.color}`}>
                {moistStatus.text}
              </span>
              <span className="text-[11px] text-stone-500">
                Target: {plotCrops[0]?.targetMoistureMin ?? 35}% - {plotCrops[0]?.targetMoistureMax ?? 70}%
              </span>
            </div>
            {/* Visual meter bar */}
            <div className="w-full bg-stone-200/80 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (latestReading?.soilMoisture ?? 0) < 25
                    ? 'bg-rose-500'
                    : (latestReading?.soilMoisture ?? 0) < 35
                    ? 'bg-amber-500'
                    : (latestReading?.soilMoisture ?? 0) > 80
                    ? 'bg-blue-600'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, latestReading?.soilMoisture ?? 0))}%` }}
              />
            </div>
          </div>

          {/* Temperature */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Temperature
              </span>
              <Thermometer className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {latestReading?.temperature ?? '--'}°C
              </span>
              <span className="text-xs text-stone-500">ambient</span>
            </div>
            <p className="mt-2 text-xs text-stone-600">
              {(latestReading?.temperature ?? 0) >= 35 ? (
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> High heat warning
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">Optimal crop range</span>
              )}
            </p>
          </div>

          {/* Humidity */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Humidity
              </span>
              <Wind className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {latestReading?.humidity ?? '--'}%
              </span>
              <span className="text-xs text-stone-500">RH</span>
            </div>
            <p className="mt-2 text-xs text-stone-600">
              {(latestReading?.humidity ?? 0) > 80 ? (
                <span className="text-amber-700 font-medium">High fungal moisture risk</span>
              ) : (
                <span className="text-stone-500">Normal evaporation</span>
              )}
            </p>
          </div>

          {/* Rainfall */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Precipitation
              </span>
              <CloudRain className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {latestReading?.rainfall ?? '0'}
              </span>
              <span className="text-xs text-stone-500">mm recorded</span>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Method: {activePlot?.irrigationType || 'Drip'}
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Agronomic Weather Forecast Component */}
      <WeatherForecast />

      {/* Quick Actions (Large Touch-Friendly Targets) */}
      <div>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
          Quick Farm Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-xs font-bold transition-all shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="truncate">Scan Seed/Bag QR</span>
            </button>
          )}

          <button
            onClick={onOpenRecordReading}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-900 text-xs font-semibold transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span className="truncate">Enter Reading</span>
          </button>

          <button
            onClick={onOpenScheduleActivity}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-900 text-xs font-semibold transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="truncate">Schedule Task</span>
          </button>

          <button
            onClick={onOpenLogHarvest}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-900 text-xs font-semibold transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="truncate">Record Harvest</span>
          </button>

          <button
            onClick={onOpenPestReport}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-900 text-xs font-semibold transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="truncate">Report Pest</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Crops in Plot & Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Crops in selected plot */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-900">
              Crops in {activePlot?.name}
            </h3>
            <button
              onClick={() => onNavigateToTab('farms')}
              className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
            >
              Manage Crops <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {plotCrops.length === 0 ? (
            <p className="text-xs text-stone-500 py-4 text-center">
              No crops registered in this plot yet.
            </p>
          ) : (
            <div className="space-y-3">
              {plotCrops.map((crop) => (
                <div
                  key={crop.id}
                  className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {crop.name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Variety: {crop.variety} · Planted: {crop.plantingDate}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                        {crop.growthStage}
                      </span>
                      <span className="text-stone-600">
                        Harvest: {crop.expectedHarvestDate}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2 py-1 rounded-md font-semibold shrink-0 ${
                      crop.healthStatus === 'Healthy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : crop.healthStatus === 'Needs Attention'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {crop.healthStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Activities Checklist */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-900">
              Pending Farm Activities
            </h3>
            <button
              onClick={() => onNavigateToTab('records')}
              className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
            >
              All Activities <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingActivities.length === 0 ? (
            <p className="text-xs text-stone-500 py-4 text-center">
              All scheduled activities are completed!
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-stone-200 hover:border-stone-300 flex items-center justify-between gap-3 bg-white transition"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleActivityStatus(act.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        act.status === 'Completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 hover:border-emerald-600'
                      }`}
                      aria-label="Toggle task status"
                    >
                      {act.status === 'Completed' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Type: {act.activityType} · Due: {act.scheduledDate}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      act.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : act.priority === 'High'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {act.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Farm Plots & What I'm Farming Layout */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Plots & Active Farming Overview ({currentFarm?.name || 'Farm Site'})
              </h3>
              <p className="text-xs text-stone-500">
                Detailed breakdown of parcels, soil textures, irrigation systems, and cultivated crops
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="text-xs text-stone-700 hover:text-emerald-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Register New Site</span>
              </button>
            )}
            <button
              onClick={() => onNavigateToTab('farms')}
              className="text-xs text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Manage Plots</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activePlotList.map((plot) => {
            const plotCropList = crops.filter((c) => c.plotId === plot.id);
            const plotReading = readings.find((r) => r.plotId === plot.id);

            return (
              <div
                key={plot.id}
                onClick={() => setSelectedPlotId(plot.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedPlotId === plot.id
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{plot.name}</span>
                      {selectedPlotId === plot.id && (
                        <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      {plot.size} {currentFarm?.areaUnit || 'acres'} · {plot.soilType}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                    {plot.irrigationType}
                  </span>
                </div>

                {/* What is being farmed */}
                <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                    Cultivating:
                  </span>
                  {plotCropList.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">No crop registered yet</p>
                  ) : (
                    plotCropList.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 flex items-center gap-1">
                          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                          {c.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                          {c.growthStage}
                        </span>
                      </div>
                    ))
                  )}

                  {plotReading && (
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      <span>Soil Moisture: <strong className="text-stone-800">{plotReading.soilMoisture}%</strong></span>
                      <span>Temp: <strong className="text-stone-800">{plotReading.temperature}°C</strong></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
