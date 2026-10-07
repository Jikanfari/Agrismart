import React, { useState, useEffect } from 'react';
import {
  Droplets, Thermometer, Wind, CloudRain, Plus, Radio, Play, Pause,
  Calendar, Check, AlertCircle, ArrowDownRight, ArrowUpRight, Filter
} from 'lucide-react';
import { Plot, Crop, SensorReading, IrrigationAlert } from '../../types';
import { evaluateDecisionRules } from '../../services/rulesEngine';
import { storage } from '../../services/storage';

interface EnvironmentMonitoringProps {
  plots: Plot[];
  crops: Crop[];
  readings: SensorReading[];
  onAddReading: (reading: SensorReading) => void;
  onAlertGenerated: (alert: IrrigationAlert) => void;
}

export const EnvironmentMonitoring: React.FC<EnvironmentMonitoringProps> = ({
  plots,
  crops,
  readings,
  onAddReading,
  onAlertGenerated,
}) => {
  const [filterPlotId, setFilterPlotId] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);
  const [isIoTSimulating, setIsIoTSimulating] = useState(false);

  // Form state
  const [newReading, setNewReading] = useState({
    plotId: plots[0]?.id || '',
    soilMoisture: 35,
    temperature: 28,
    humidity: 65,
    rainfall: 0,
    notes: '',
  });

  // IoT Simulation effect
  useEffect(() => {
    let interval: any;
    if (isIoTSimulating && plots.length > 0) {
      interval = setInterval(() => {
        // Random plot
        const randomPlot = plots[Math.floor(Math.random() * plots.length)];
        // Generate realistic fluctuated reading
        const baseMoisture = Math.floor(Math.random() * 45) + 20; // 20% - 65%
        const baseTemp = Number((Math.random() * 12 + 24).toFixed(1)); // 24°C - 36°C
        const baseHumidity = Math.floor(Math.random() * 35) + 50; // 50% - 85%
        const baseRain = Math.random() > 0.8 ? Number((Math.random() * 10).toFixed(1)) : 0;

        const simulated: SensorReading = {
          id: `read-iot-${Date.now()}`,
          plotId: randomPlot.id,
          soilMoisture: baseMoisture,
          temperature: baseTemp,
          humidity: baseHumidity,
          rainfall: baseRain,
          recordedAt: new Date().toISOString(),
          source: 'iot_sensor',
          notes: 'Automated telemetry packet via IoT gateway #GW-01',
          synced: storage.getEffectiveOnlineStatus(),
        };

        onAddReading(simulated);

        // Check rules
        const rulesConfig = storage.getRulesConfig();
        const triggeredAlerts = evaluateDecisionRules(simulated, randomPlot, crops, rulesConfig);
        triggeredAlerts.forEach((a) => {
          storage.addAlert(a);
          onAlertGenerated(a);
        });
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [isIoTSimulating, plots, crops]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plot = plots.find((p) => p.id === newReading.plotId) || plots[0];
    if (!plot) return;

    const reading: SensorReading = {
      id: `read-${Date.now()}`,
      plotId: plot.id,
      soilMoisture: Number(newReading.soilMoisture),
      temperature: Number(newReading.temperature),
      humidity: Number(newReading.humidity),
      rainfall: Number(newReading.rainfall),
      recordedAt: new Date().toISOString(),
      source: 'manual',
      notes: newReading.notes || 'Manual field measurement',
      synced: storage.getEffectiveOnlineStatus(),
    };

    onAddReading(reading);

    // Rule evaluation
    const rulesConfig = storage.getRulesConfig();
    const triggered = evaluateDecisionRules(reading, plot, crops, rulesConfig);
    triggered.forEach((a) => {
      storage.addAlert(a);
      onAlertGenerated(a);
    });

    setShowManualModal(false);
    setNewReading({
      plotId: plots[0]?.id || '',
      soilMoisture: 35,
      temperature: 28,
      humidity: 65,
      rainfall: 0,
      notes: '',
    });
  };

  const filteredReadings =
    filterPlotId === 'all'
      ? readings
      : readings.filter((r) => r.plotId === filterPlotId);

  return (
    <div className="space-y-5 pb-16">
      {/* Title & Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Soil & Environmental Monitoring
          </h2>
          <p className="text-xs text-stone-500">
            Record soil moisture, temperature, humidity and rainfall to trigger smart irrigation alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* IoT Telemetry Simulation Toggle */}
          <button
            onClick={() => setIsIoTSimulating(!isIoTSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isIoTSimulating
                ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
            }`}
            title="Simulate automatic incoming sensor data streams"
          >
            <Radio className="w-3.5 h-3.5 text-rose-600" />
            <span>{isIoTSimulating ? 'Stop IoT Stream' : 'Simulate IoT Telemetry'}</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" /> Enter Reading
          </button>
        </div>
      </div>

      {/* Filter and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/80 p-3 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-semibold text-stone-700">Filter by Plot:</span>
          <select
            value={filterPlotId}
            onChange={(e) => setFilterPlotId(e.target.value)}
            className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:outline-hidden"
          >
            <option value="all">All Plots ({readings.length} readings)</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-stone-600 font-medium">
          Showing {filteredReadings.length} recorded telemetry points
        </div>
      </div>

      {/* Readings Log Table / Cards */}
      <div className="space-y-3">
        {filteredReadings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-xs text-stone-500">
            No readings recorded for this plot yet. Use "+ Enter Reading" above.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-semibold">
                    <th className="p-3">Plot</th>
                    <th className="p-3">Soil Moisture</th>
                    <th className="p-3">Temperature</th>
                    <th className="p-3">Humidity</th>
                    <th className="p-3">Precipitation</th>
                    <th className="p-3">Source & Time</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredReadings.map((r) => {
                    const plot = plots.find((p) => p.id === r.plotId);
                    const isLowMoist = r.soilMoisture < 35;
                    const isHighTemp = r.temperature >= 35;

                    return (
                      <tr key={r.id} className="hover:bg-stone-50/60 transition">
                        <td className="p-3 font-semibold text-stone-900">
                          {plot?.name || 'Plot'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
                              r.soilMoisture < 25
                                ? 'bg-rose-100 text-rose-800'
                                : isLowMoist
                                ? 'bg-amber-100 text-amber-800'
                                : r.soilMoisture > 80
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <Droplets className="w-3 h-3" />
                            {r.soilMoisture}%
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          <span className={isHighTemp ? 'text-rose-700 font-bold' : 'text-stone-800'}>
                            {r.temperature}°C
                          </span>
                        </td>
                        <td className="p-3 font-medium text-stone-800">
                          {r.humidity}%
                        </td>
                        <td className="p-3 text-stone-600">
                          {r.rainfall > 0 ? `${r.rainfall} mm` : '0 mm'}
                        </td>
                        <td className="p-3 text-stone-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                              {r.source === 'iot_sensor' ? 'IoT' : 'Manual'}
                            </span>
                            <span>{new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 block">
                            {new Date(r.recordedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3 text-stone-600 max-w-[200px] truncate">
                          {r.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: MANUAL DATA ENTRY */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleManualSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">Record Environmental Reading</h3>
                <p className="text-xs text-stone-500">Manual probe readings with automated rule evaluation</p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Plot *</label>
                <select
                  required
                  value={newReading.plotId}
                  onChange={(e) => setNewReading({ ...newReading, plotId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.soilType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Moisture input */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-emerald-950 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-700" />
                    Soil Moisture (%) *
                  </label>
                  <span className="font-bold text-sm text-emerald-900">{newReading.soilMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={newReading.soilMoisture}
                  onChange={(e) => setNewReading({ ...newReading, soilMoisture: Number(e.target.value) })}
                  className="w-full accent-emerald-700"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                  <span>Dry (&lt;25%)</span>
                  <span>Optimal (35-75%)</span>
                  <span>Saturated (&gt;80%)</span>
                </div>
              </div>

              {/* Temperature & Humidity */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Temperature (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newReading.temperature}
                    onChange={(e) => setNewReading({ ...newReading, temperature: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="28.0"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Relative Humidity (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={newReading.humidity}
                    onChange={(e) => setNewReading({ ...newReading, humidity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="65"
                  />
                </div>
              </div>

              {/* Rainfall */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Precipitation / Rainfall (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newReading.rainfall}
                  onChange={(e) => setNewReading({ ...newReading, rainfall: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="0.0"
                />
              </div>

              {/* Observation notes */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Field Observation Notes</label>
                <input
                  type="text"
                  value={newReading.notes}
                  onChange={(e) => setNewReading({ ...newReading, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="e.g. Soil feels crusty; drip line filter cleaned."
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
              >
                Save & Evaluate Rules
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
