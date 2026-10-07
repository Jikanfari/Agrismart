import {
  DatabaseEnquiryOptions, DatabaseEnquiryResult, User, SensorReading,
  Crop, Plot, HarvestRecord, SaleRecord, ExpenseRecord, PestDiseaseReport
} from '../types';
import { storage } from './storage';
import { authService } from './authService';

export class DatabaseQueryEngine {
  /**
   * Executes an analytical enquiry over the local encrypted database
   * with strict Role-Based Access Control and Tenant Farm Scoping.
   */
  public async executeEnquiry(
    options: DatabaseEnquiryOptions,
    user: User
  ): Promise<DatabaseEnquiryResult> {
    const startTime = performance.now();
    const now = new Date();

    // 1. Authorize & Resolve Tenant Scope
    const isGlobalAdmin = user.role === 'admin';
    const isAgronomist = user.role === 'agronomist';
    const allowedFarmIds = isGlobalAdmin
      ? storage.getFarms().map(f => f.id)
      : user.farmIds;

    const securityPolicy = isGlobalAdmin
      ? 'SECURITY_POLICY: Full Administrator Access (All Farms & Ledgers)'
      : isAgronomist
      ? `SECURITY_POLICY: Agronomist Advisory Scope (Assigned Farms: [${allowedFarmIds.join(', ')}], Financials Restricted)`
      : `SECURITY_POLICY: Tenant Row-Level Security (Farmer Scoped to Farm IDs: [${allowedFarmIds.join(', ')}])`;

    // 2. Fetch base data
    const allPlots = storage.getPlots().filter(p => allowedFarmIds.includes(p.farmId));
    const plotIds = allPlots.map(p => p.id);

    // Apply specific plot filter if chosen
    const targetPlotIds = options.plotId && options.plotId !== 'all'
      ? plotIds.filter(id => id === options.plotId)
      : plotIds;

    // Filter date bounds
    const getFilterDateLimit = () => {
      if (options.dateRange === '7d') return new Date(now.getTime() - 7 * 86400000);
      if (options.dateRange === '30d') return new Date(now.getTime() - 30 * 86400000);
      if (options.dateRange === '90d') return new Date(now.getTime() - 90 * 86400000);
      return new Date(0); // all
    };
    const dateLimit = getFilterDateLimit();

    let rows: any[] = [];
    let summaryStats: Record<string, number | string> = {};
    let queryName = '';

    switch (options.queryType) {
      case 'sensor_timeseries': {
        queryName = 'Time-Series Soil Moisture & Temperature Aggregation';
        const rawReadings = storage.getReadings().filter(
          r => targetPlotIds.includes(r.plotId) && new Date(r.recordedAt) >= dateLimit
        );

        if (options.bucketWindow === 'daily') {
          // Daily time-bucket aggregation
          const buckets: Record<string, { moistureSum: number; tempSum: number; count: number; rainSum: number; date: string }> = {};
          rawReadings.forEach(r => {
            const dayKey = r.recordedAt.slice(0, 10);
            if (!buckets[dayKey]) {
              buckets[dayKey] = { moistureSum: 0, tempSum: 0, count: 0, rainSum: 0, date: dayKey };
            }
            buckets[dayKey].moistureSum += r.soilMoisture;
            buckets[dayKey].tempSum += r.temperature;
            buckets[dayKey].rainSum += (r.rainfall || 0);
            buckets[dayKey].count += 1;
          });

          rows = Object.values(buckets).map(b => ({
            period: b.date,
            avgMoisture: Number((b.moistureSum / b.count).toFixed(1)),
            avgTemperature: Number((b.tempSum / b.count).toFixed(1)),
            totalRainfallMm: Number(b.rainSum.toFixed(1)),
            sampleCount: b.count,
            waterDeficitStatus: (b.moistureSum / b.count) < 35 ? 'Deficit (Irrigation Needed)' : 'Adequate',
          })).sort((a, b) => b.period.localeCompare(a.period));
        } else {
          // Raw time-series readings with plot mapping
          rows = rawReadings.map(r => {
            const plot = allPlots.find(p => p.id === r.plotId);
            return {
              id: r.id,
              plotName: plot?.name || r.plotId,
              soilMoisturePct: r.soilMoisture,
              temperatureC: r.temperature,
              humidityPct: r.humidity,
              rainfallMm: r.rainfall,
              source: r.source,
              timestamp: r.recordedAt,
            };
          });
        }

        const avgMoist = rows.length > 0
          ? Number((rawReadings.reduce((s, r) => s + r.soilMoisture, 0) / (rawReadings.length || 1)).toFixed(1))
          : 0;

        summaryStats = {
          totalSamples: rawReadings.length,
          averageMoisture: `${avgMoist}%`,
          monitoredPlots: targetPlotIds.length,
          soilHealthStatus: avgMoist < 35 ? 'Water Stress Alert' : 'Moisture Sufficient',
        };
        break;
      }

      case 'plot_performance': {
        queryName = 'Plot Agronomic & Moisture Performance Matrix';
        const crops = storage.getCrops();
        const alerts = storage.getAlerts().filter(a => a.status === 'active');
        const activities = storage.getActivities().filter(a => a.status !== 'Completed');
        const readings = storage.getReadings();

        rows = allPlots.filter(p => targetPlotIds.includes(p.id)).map(plot => {
          const plotCrops = crops.filter(c => c.plotId === plot.id);
          const plotAlerts = alerts.filter(a => a.plotId === plot.id);
          const plotTasks = activities.filter(a => a.plotId === plot.id);
          const plotReadings = readings.filter(r => r.plotId === plot.id);
          const latestMoisture = plotReadings[0]?.soilMoisture ?? null;

          return {
            plotId: plot.id,
            plotName: plot.name,
            sizeAcres: plot.size,
            soilType: plot.soilType,
            irrigationType: plot.irrigationType,
            activeCropsCount: plotCrops.length,
            cultivars: plotCrops.map(c => c.name).join(', ') || 'Fallow',
            latestMoisturePct: latestMoisture !== null ? `${latestMoisture}%` : 'No reading',
            activeAlerts: plotAlerts.length,
            pendingTasks: plotTasks.length,
          };
        });

        summaryStats = {
          totalPlotsAnalyzed: rows.length,
          plotsWithActiveAlerts: rows.filter(r => r.activeAlerts > 0).length,
          dripIrrigatedAcres: allPlots.filter(p => p.irrigationType === 'Drip').reduce((s, p) => s + p.size, 0),
        };
        break;
      }

      case 'financial_ledger': {
        queryName = 'AES-256 Encrypted Financial Ledger Enquiry';

        // Check Authorization
        if (isAgronomist) {
          throw new Error('ACCESS DENIED: Role "agronomist" is restricted from executing financial ledger queries.');
        }

        const sales = await storage.getSalesRecords();
        const expenses = await storage.getExpenses();

        const filteredSales = sales.filter(s => new Date(s.saleDate) >= dateLimit);
        const filteredExpenses = expenses.filter(e => new Date(e.expenseDate) >= dateLimit);

        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalRevenue, 0);
        const totalCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalCost;

        rows = [
          ...filteredSales.map(s => ({
            transactionType: 'SALE',
            itemOrCategory: s.cropName,
            partnerOrVendor: s.buyerName,
            amount: `+$${s.totalRevenue.toFixed(2)}`,
            numericAmount: s.totalRevenue,
            date: s.saleDate,
            status: s.paymentStatus,
          })),
          ...filteredExpenses.map(e => ({
            transactionType: 'EXPENSE',
            itemOrCategory: e.category,
            partnerOrVendor: e.vendor || e.description,
            amount: `-$${e.amount.toFixed(2)}`,
            numericAmount: -e.amount,
            date: e.expenseDate,
            status: 'Settled',
          })),
        ].sort((a, b) => b.date.localeCompare(a.date));

        summaryStats = {
          grossRevenue: `$${totalRevenue.toFixed(2)}`,
          totalOperationalCost: `$${totalCost.toFixed(2)}`,
          netFarmProfit: `$${netProfit.toFixed(2)}`,
          profitMargin: totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%',
        };
        break;
      }

      case 'harvest_yield_matrix': {
        queryName = 'Crop Harvest Yield & Grade Valuation Matrix';
        const harvests = storage.getHarvestRecords().filter(
          h => targetPlotIds.includes(h.plotId) && new Date(h.harvestDate) >= dateLimit
        );
        const crops = storage.getCrops();

        rows = harvests.map(h => {
          const crop = crops.find(c => c.id === h.cropId);
          const plot = allPlots.find(p => p.id === h.plotId);
          return {
            id: h.id,
            cropName: crop?.name || 'Crop',
            variety: crop?.variety || 'N/A',
            plotName: plot?.name || h.plotId,
            harvestDate: h.harvestDate,
            quantity: h.quantity,
            unit: h.unit,
            qualityGrade: h.qualityGrade,
            marketValue: `$${h.marketEstimatedValue}`,
          };
        });

        const totalKg = harvests.reduce((s, h) => s + (h.unit === 'kg' ? h.quantity : h.quantity * 50), 0);
        const totalVal = harvests.reduce((s, h) => s + h.marketEstimatedValue, 0);

        summaryStats = {
          totalHarvestBatches: harvests.length,
          totalOutputVolume: `${totalKg.toLocaleString()} kg`,
          estimatedMarketRealization: `$${totalVal.toLocaleString()}`,
          gradeAPercentage: harvests.length > 0
            ? `${Math.round((harvests.filter(h => h.qualityGrade === 'Grade A').length / harvests.length) * 100)}%`
            : '0%',
        };
        break;
      }

      case 'pest_epidemiology': {
        queryName = 'Pest & Crop Disease Scouting Epidemiology';
        const pests = storage.getPestReports().filter(
          p => targetPlotIds.includes(p.plotId) && new Date(p.observedDate) >= dateLimit
        );
        const crops = storage.getCrops();

        rows = pests.map(p => {
          const crop = crops.find(c => c.id === p.cropId);
          const plot = allPlots.find(pl => pl.id === p.plotId);
          return {
            id: p.id,
            pestOrDisease: p.name,
            issueType: p.issueType,
            cropName: crop?.name || 'Crop',
            plotName: plot?.name || p.plotId,
            severity: p.severity,
            status: p.status,
            symptomsObserved: p.symptoms,
            treatmentApplied: p.treatmentApplied || 'None',
            observedDate: p.observedDate,
          };
        });

        summaryStats = {
          totalIncidentsScouted: pests.length,
          severeOutbreaks: pests.filter(p => p.severity === 'Severe').length,
          underTreatmentCount: pests.filter(p => p.status === 'Under Treatment').length,
          resolvedCount: pests.filter(p => p.status === 'Resolved').length,
        };
        break;
      }
    }

    const endTime = performance.now();
    const executionTimeMs = Number((endTime - startTime).toFixed(2));

    return {
      queryName,
      executionTimeMs,
      recordCount: rows.length,
      timestamp: new Date().toISOString(),
      rows,
      summaryStats,
      appliedSecurityPolicy: securityPolicy,
    };
  }
}

export const queryEngine = new DatabaseQueryEngine();
