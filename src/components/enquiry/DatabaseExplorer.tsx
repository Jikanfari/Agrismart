import React, { useState, useEffect } from 'react';
import {
  Database, Search, Filter, Clock, ShieldCheck, Download,
  Layers, CheckCircle2, AlertTriangle, ArrowUpDown, RefreshCw,
  BarChart3, FileSpreadsheet, Lock
} from 'lucide-react';
import { queryEngine } from '../../services/queryEngine';
import {
  DatabaseEnquiryOptions, DatabaseEnquiryResult, User, Plot
} from '../../types';

interface DatabaseExplorerProps {
  currentUser: User;
  plots: Plot[];
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  currentUser,
  plots,
}) => {
  const [queryType, setQueryType] = useState<DatabaseEnquiryOptions['queryType']>('sensor_timeseries');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DatabaseEnquiryOptions['dateRange']>('30d');
  const [bucketWindow, setBucketWindow] = useState<DatabaseEnquiryOptions['bucketWindow']>('daily');

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DatabaseEnquiryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runQuery = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await queryEngine.executeEnquiry(
        {
          queryType,
          plotId: selectedPlotId,
          dateRange,
          bucketWindow,
        },
        currentUser
      );
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Query execution error');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runQuery();
  }, [queryType, selectedPlotId, dateRange, bucketWindow, currentUser]);

  const handleExportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrismart-query-${queryType}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-xs space-y-5">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Database Enquiry & Analytics Explorer
            </h3>
            <p className="text-xs text-stone-500">
              Real-time query engine with Row-Level Security (RLS) & tenant isolation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}

          <button
            onClick={runQuery}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Execute Query</span>
          </button>
        </div>
      </div>

      {/* Query Parameters Filter Bar */}
      <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-stone-700 mb-1">Enquiry Target</label>
          <select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value as any)}
            className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-hidden"
          >
            <option value="sensor_timeseries">Time-Series Soil Moisture & Temp</option>
            <option value="plot_performance">Plot Agronomic & Moisture Matrix</option>
            <option value="financial_ledger">Encrypted Financial Ledger (RLS)</option>
            <option value="harvest_yield_matrix">Crop Harvest Yields & Grading</option>
            <option value="pest_epidemiology">Pest & Disease Epidemiology</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Plot Scope</label>
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-hidden"
          >
            <option value="all">All Accessible Plots</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Time Horizon</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-hidden"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter (90 Days)</option>
            <option value="all">Full Season (All-Time)</option>
          </select>
        </div>

        {queryType === 'sensor_timeseries' && (
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Aggregation Window</label>
            <select
              value={bucketWindow}
              onChange={(e) => setBucketWindow(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-hidden"
            >
              <option value="daily">Daily Averages (Time-Bucket)</option>
              <option value="raw">Raw Individual Telemetry Points</option>
            </select>
          </div>
        )}
      </div>

      {/* Query Security & Execution Badge */}
      {result && (
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold text-emerald-950">
              {result.appliedSecurityPolicy}
            </span>
          </div>

          <div className="flex items-center gap-3 text-stone-600 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Latency: <strong className="text-stone-900">{result.executionTimeMs} ms</strong>
            </span>
            <span>
              Rows: <strong className="text-stone-900">{result.recordCount}</strong>
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <strong className="block">Security Enforcement Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards from Query */}
      {result?.summaryStats && Object.keys(result.summaryStats).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(result.summaryStats).map(([key, value]) => (
            <div key={key} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold block truncate">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <p className="text-base font-bold text-stone-900 mt-0.5 truncate">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Query Results Table */}
      {result && result.rows.length > 0 && (
        <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-stone-100/90 backdrop-blur-xs text-stone-700 font-semibold border-b border-stone-200 z-10">
                <tr>
                  {Object.keys(result.rows[0]).map((col) => (
                    <th key={col} className="p-2.5 capitalize whitespace-nowrap">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70 transition">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="p-2.5 text-stone-800 whitespace-nowrap font-medium">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.rows.length === 0 && (
        <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl">
          No records match the selected query criteria and tenant scope.
        </div>
      )}
    </div>
  );
};
