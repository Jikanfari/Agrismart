import React, { useState } from 'react';
import {
  BarChart3, Download, TrendingUp, TrendingDown,
  Droplets, Thermometer, Sprout, DollarSign, CheckCircle2,
  Calendar, Printer
} from 'lucide-react';
import {
  SensorReading, HarvestRecord, FarmActivity, SaleRecord, ExpenseRecord,
  Plot, Crop, User
} from '../../types';
import { DatabaseExplorer } from '../enquiry/DatabaseExplorer';

interface ReportsAndChartsProps {
  plots: Plot[];
  crops: Crop[];
  readings: SensorReading[];
  harvests: HarvestRecord[];
  activities: FarmActivity[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  currentUser: User;
}

export const ReportsAndCharts: React.FC<ReportsAndChartsProps> = ({
  plots,
  crops,
  readings,
  harvests,
  activities,
  sales,
  expenses,
  currentUser,
}) => {
  const [chartMetric, setChartMetric] = useState<'moisture' | 'temperature' | 'financial'>('moisture');

  // Total finances
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Activities completion
  const completedTasks = activities.filter((a) => a.status === 'Completed').length;
  const completionRate = activities.length > 0 ? Math.round((completedTasks / activities.length) * 100) : 100;

  // Prepare moisture trend points (sorted chronological)
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 35;

  const getMoisturePath = () => {
    if (sortedReadings.length < 2) return '';
    const points = sortedReadings.map((r, i) => {
      const x = padding + (i / (sortedReadings.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (r.soilMoisture / 100) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getTempPath = () => {
    if (sortedReadings.length < 2) return '';
    const maxTemp = 45;
    const points = sortedReadings.map((r, i) => {
      const x = padding + (i / (sortedReadings.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (r.temperature / maxTemp) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // CSV Export function
  const handleExportCSV = () => {
    const rows = [
      ['--- AGRISMART MONITORING EXPORT REPORT ---'],
      ['Exported At', new Date().toISOString()],
      [''],
      ['--- ENVIRONMENTAL SENSOR READINGS ---'],
      ['ID', 'Plot', 'Soil Moisture (%)', 'Temperature (C)', 'Humidity (%)', 'Precipitation (mm)', 'Source', 'Recorded At', 'Notes'],
      ...readings.map((r) => [
        r.id,
        plots.find((p) => p.id === r.plotId)?.name || r.plotId,
        r.soilMoisture,
        r.temperature,
        r.humidity,
        r.rainfall,
        r.source,
        r.recordedAt,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ]),
      [''],
      ['--- HARVEST RECORDS ---'],
      ['ID', 'Crop', 'Plot', 'Harvest Date', 'Quantity', 'Unit', 'Quality Grade', 'Est Value'],
      ...harvests.map((h) => [
        h.id,
        crops.find((c) => c.id === h.cropId)?.name || h.cropId,
        plots.find((p) => p.id === h.plotId)?.name || h.plotId,
        h.harvestDate,
        h.quantity,
        h.unit,
        h.qualityGrade,
        h.marketEstimatedValue,
      ]),
      [''],
      ['--- FINANCIAL SALES ---'],
      ['ID', 'Crop', 'Buyer', 'Quantity', 'Unit Price', 'Total Revenue', 'Status', 'Date'],
      ...sales.map((s) => [
        s.id,
        s.cropName,
        s.buyerName,
        s.quantity,
        s.unitPrice,
        s.totalRevenue,
        s.paymentStatus,
        s.saleDate,
      ]),
      [''],
      ['--- EXPENSES ---'],
      ['ID', 'Category', 'Description', 'Amount', 'Date', 'Vendor'],
      ...expenses.map((e) => [
        e.id,
        e.category,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.amount,
        e.expenseDate,
        e.vendor || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrismart-farm-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header & Export button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Performance Reports & Analytics
          </h2>
          <p className="text-xs text-stone-500">
            Visual environmental trends, crop yields, and financial records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" /> Export CSV Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-xs text-stone-500">Task Completion Rate</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{completionRate}%</p>
          <p className="text-[11px] text-stone-400 mt-0.5">{completedTasks} of {activities.length} tasks done</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-xs text-stone-500">Total Harvest Logged</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">
            {harvests.reduce((sum, h) => sum + h.quantity, 0).toLocaleString()} kg
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">{harvests.length} harvest events</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-xs text-stone-500">Cumulative Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">${totalRevenue.toFixed(0)}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">{sales.length} produce deliveries</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-xs text-stone-500">Net Farm Profit</p>
          <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ${netProfit.toFixed(0)}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Expenses: ${totalExpenses.toFixed(0)}</p>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Historical Environmental Trend Analysis
            </h3>
            <p className="text-xs text-stone-500">
              Timeline of recorded field sensor observations against rule thresholds.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setChartMetric('moisture')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                chartMetric === 'moisture' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Soil Moisture (%)
            </button>
            <button
              onClick={() => setChartMetric('temperature')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                chartMetric === 'temperature' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Temperature (°C)
            </button>
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[480px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 select-none">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Y Axis Labels */}
              {chartMetric === 'moisture' ? (
                <>
                  <text x={padding - 6} y={padding + 4} textAnchor="end" className="text-[10px] fill-stone-400 font-mono">100%</text>
                  <text x={padding - 6} y={chartHeight / 2 + 4} textAnchor="end" className="text-[10px] fill-stone-400 font-mono">50%</text>
                  <text x={padding - 6} y={chartHeight - padding + 4} textAnchor="end" className="text-[10px] fill-stone-400 font-mono">0%</text>

                  {/* 35% Safe Threshold Line */}
                  <line
                    x1={padding}
                    y1={chartHeight - padding - (35 / 100) * (chartHeight - padding * 2)}
                    x2={chartWidth - padding}
                    y2={chartHeight - padding - (35 / 100) * (chartHeight - padding * 2)}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartWidth - padding}
                    y={chartHeight - padding - (35 / 100) * (chartHeight - padding * 2) - 4}
                    textAnchor="end"
                    className="text-[9px] fill-amber-600 font-bold"
                  >
                    Rule Threshold: 35% (Irrigate below)
                  </text>

                  {/* Data Path */}
                  <path
                    d={getMoisturePath()}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {sortedReadings.map((r, i) => {
                    const x = padding + (i / Math.max(1, sortedReadings.length - 1)) * (chartWidth - padding * 2);
                    const y = chartHeight - padding - (r.soilMoisture / 100) * (chartHeight - padding * 2);
                    return (
                      <g key={r.id}>
                        <circle cx={x} cy={y} r="4" fill={r.soilMoisture < 35 ? '#ef4444' : '#16a34a'} stroke="#ffffff" strokeWidth="2" />
                      </g>
                    );
                  })}
                </>
              ) : (
                <>
                  <text x={padding - 6} y={padding + 4} textAnchor="end" className="text-[10px] fill-stone-400 font-mono">45°C</text>
                  <text x={padding - 6} y={chartHeight / 2 + 4} textAnchor="end" className="text-[10px] fill-stone-400 font-mono">22°C</text>
                  <text x={padding - 6} y={chartHeight - padding + 4} textAnchor="end" className="text-[10px] fill-stone-400 font-mono">0°C</text>

                  {/* 35°C Heat Threshold Line */}
                  <line
                    x1={padding}
                    y1={chartHeight - padding - (35 / 45) * (chartHeight - padding * 2)}
                    x2={chartWidth - padding}
                    y2={chartHeight - padding - (35 / 45) * (chartHeight - padding * 2)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartWidth - padding}
                    y={chartHeight - padding - (35 / 45) * (chartHeight - padding * 2) - 4}
                    textAnchor="end"
                    className="text-[9px] fill-rose-600 font-bold"
                  >
                    Heat Stress Limit: 35°C
                  </text>

                  {/* Temp Line */}
                  <path
                    d={getTempPath()}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sortedReadings.map((r, i) => {
                    const x = padding + (i / Math.max(1, sortedReadings.length - 1)) * (chartWidth - padding * 2);
                    const y = chartHeight - padding - (r.temperature / 45) * (chartHeight - padding * 2);
                    return (
                      <circle key={r.id} cx={x} cy={y} r="4" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 px-2">
          <span>Earliest recorded</span>
          <span className="font-medium text-stone-700">Chronological telemetry stream</span>
          <span>Latest reading</span>
        </div>
      </div>

      {/* Crop Yield Distribution & Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Harvest Yield by Crop */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
            Crop Harvest Yield Summary
          </h4>
          <div className="space-y-3">
            {crops.map((c) => {
              const cropHarvests = harvests.filter((h) => h.cropId === c.id);
              const totalKg = cropHarvests.reduce((sum, h) => sum + h.quantity, 0);
              const maxScale = 2000;
              const pct = Math.min(100, Math.round((totalKg / maxScale) * 100));

              return (
                <div key={c.id}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-stone-900">{c.name} ({c.variety})</span>
                    <span className="font-bold text-emerald-800">{totalKg} kg</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Flow Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
            Farm Financial Ledger Summary
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 text-emerald-950">
              <span>Gross Crop Sales (Revenue)</span>
              <strong className="text-emerald-800">+${totalRevenue.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50 text-rose-950">
              <span>Total Farm Operational Expenses</span>
              <strong className="text-rose-800">-${totalExpenses.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-stone-900 text-white font-bold">
              <span>Net Operating Profit</span>
              <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                ${netProfit.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 italic">
              Encrypted locally with AES-GCM 256-bit cryptography. Data automatically syncs with central server upon internet reconnect.
            </p>
          </div>
        </div>
      </div>

      {/* Database Enquiry & Analytics Explorer */}
      <DatabaseExplorer currentUser={currentUser} plots={plots} />
    </div>
  );
};
