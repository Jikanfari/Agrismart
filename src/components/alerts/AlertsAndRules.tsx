import React, { useState } from 'react';
import {
  BellRing, AlertTriangle, AlertCircle, CheckCircle2, Info, Volume2,
  Sliders, Check, RefreshCw, Layers
} from 'lucide-react';
import { IrrigationAlert, DecisionRulesConfig, Plot, Crop } from '../../types';
import { useAccessibility } from '../../hooks/useAccessibility';
import { storage } from '../../services/storage';

interface AlertsAndRulesProps {
  alerts: IrrigationAlert[];
  plots: Plot[];
  crops: Crop[];
  onAcknowledgeAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onUpdateRulesConfig: (config: DecisionRulesConfig) => void;
}

export const AlertsAndRules: React.FC<AlertsAndRulesProps> = ({
  alerts,
  plots,
  crops,
  onAcknowledgeAlert,
  onResolveAlert,
  onUpdateRulesConfig,
}) => {
  const { speakText } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');
  const [rulesConfig, setRulesConfig] = useState<DecisionRulesConfig>(() => storage.getRulesConfig());
  const [configSaved, setConfigSaved] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRulesConfig(rulesConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const getSeverityBadge = (sev: IrrigationAlert['severity']) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advisory':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header and View Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Smart Alerts & Decision Support
          </h2>
          <p className="text-xs text-stone-500">
            Automated agronomic recommendations powered by predefined environmental decision rules.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'alerts'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active Alerts ({activeAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'rules'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Decision Rules & Thresholds
          </button>
        </div>
      </div>

      {/* VIEW 1: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-stone-900">All Farm Parameters Normal</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                No active irrigation or stress warnings triggered. Predefined rules will automatically alert you when soil moisture or temperatures drift.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const plot = plots.find((p) => p.id === alert.plotId);
                const crop = crops.find((c) => c.id === alert.cropId);

                return (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 hover:border-stone-300 transition shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getSeverityBadge(
                              alert.severity
                            )}`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-stone-500">
                            {alert.ruleCode}
                          </span>
                          <span className="text-xs text-stone-400">
                            · {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-stone-900">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-stone-600 mt-1">
                          {alert.message}
                        </p>

                        <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs">
                          <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-emerald-700" />
                            Actionable Recommendation:
                          </p>
                          <p className="text-emerald-900 mt-1 leading-relaxed">
                            {alert.recommendation}
                          </p>
                        </div>

                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-stone-500">
                          <span>Plot: <strong className="text-stone-700">{plot?.name || 'All'}</strong></span>
                          {crop && <span>Crop: <strong className="text-stone-700">{crop.name}</strong></span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                        <button
                          onClick={() =>
                            speakText(
                              `${alert.title}. ${alert.message}. Recommendation: ${alert.recommendation}`
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium"
                          title="Read out loud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Audio</span>
                        </button>
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-medium"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past / Acknowledged alerts collapsible */}
          {acknowledgedAlerts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-200">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Acknowledged Notifications ({acknowledgedAlerts.length})
              </h4>
              <div className="space-y-2 opacity-80">
                {acknowledgedAlerts.map((a) => (
                  <div key={a.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-stone-800">{a.title}</p>
                      <p className="text-[11px] text-stone-500">{a.message}</p>
                    </div>
                    <button
                      onClick={() => onResolveAlert(a.id)}
                      className="px-2.5 py-1 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: RULES CONFIGURATION */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Predefined Rule-Based Decision Parameters
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize threshold triggers for automatic irrigation and microclimate alerts.
            </p>
          </div>

          {configSaved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Rule thresholds updated successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Rule 1: Low Moisture Threshold */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="font-bold text-stone-900 block mb-1">
                💧 Standard Low Soil Moisture Threshold (%)
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                Triggers: <code>RULE_LOW_MOISTURE</code>. Recommends scheduling irrigation within 24h.
              </p>
              <input
                type="number"
                min="10"
                max="60"
                value={rulesConfig.lowMoistureThreshold}
                onChange={(e) =>
                  setRulesConfig({ ...rulesConfig, lowMoistureThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300"
              />
            </div>

            {/* Rule 2: Critical Low Moisture */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="font-bold text-stone-900 block mb-1">
                🚨 Critical Dry Soil Moisture Threshold (%)
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                Triggers: <code>RULE_CRITICAL_LOW_MOISTURE</code>. Recommends immediate emergency watering.
              </p>
              <input
                type="number"
                min="5"
                max="40"
                value={rulesConfig.criticalMoistureThreshold}
                onChange={(e) =>
                  setRulesConfig({ ...rulesConfig, criticalMoistureThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300"
              />
            </div>

            {/* Rule 3: High Moisture (Waterlogging) */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="font-bold text-stone-900 block mb-1">
                🌊 Waterlogging Upper Threshold (%)
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                Triggers: <code>RULE_HIGH_MOISTURE</code>. Recommends shutting down irrigation and drainage checks.
              </p>
              <input
                type="number"
                min="65"
                max="95"
                value={rulesConfig.highMoistureThreshold}
                onChange={(e) =>
                  setRulesConfig({ ...rulesConfig, highMoistureThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300"
              />
            </div>

            {/* Rule 4: High Temperature Heat Stress */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="font-bold text-stone-900 block mb-1">
                ☀️ Heat Stress Upper Temperature (°C)
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                Triggers: <code>RULE_HIGH_TEMP</code>. Warns of extreme evapotranspiration; advises cooler hour watering.
              </p>
              <input
                type="number"
                min="28"
                max="45"
                value={rulesConfig.highTempThreshold}
                onChange={(e) =>
                  setRulesConfig({ ...rulesConfig, highTempThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300"
              />
            </div>

            {/* Rule 5: Fungal Humidity */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="font-bold text-stone-900 block mb-1">
                🌿 Fungal & Disease Risk Humidity (%)
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                Triggers: <code>RULE_FUNGAL_RISK</code> when humidity exceeds threshold in warm conditions.
              </p>
              <input
                type="number"
                min="60"
                max="95"
                value={rulesConfig.highHumidityThreshold}
                onChange={(e) =>
                  setRulesConfig({ ...rulesConfig, highHumidityThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300"
              />
            </div>

            {/* Rule 6: Harvest Advance Notice */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="font-bold text-stone-900 block mb-1">
                🌾 Approaching Harvest Alert Window (Days)
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                Triggers reminder when expected harvest is within this number of days.
              </p>
              <input
                type="number"
                min="1"
                max="21"
                value={rulesConfig.harvestDaysAdvanceAlert}
                onChange={(e) =>
                  setRulesConfig({ ...rulesConfig, harvestDaysAdvanceAlert: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-100">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Save Rule Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
