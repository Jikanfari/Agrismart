import {
  Farm, Plot, Crop, SensorReading, IrrigationAlert, PestDiseaseReport,
  FarmActivity, FertilizerRecord, HarvestRecord, SaleRecord, ExpenseRecord,
  User, DecisionRulesConfig, SyncQueueItem, SyncAuditLog
} from '../types';
import { encryptSensitiveData, decryptSensitiveData, isEncryptedEnvelope } from './crypto';
import { DEFAULT_RULES_CONFIG } from './rulesEngine';

// Storage Keys
const KEYS = {
  FARMS: 'agri_farms_v1',
  PLOTS: 'agri_plots_v1',
  CROPS: 'agri_crops_v1',
  READINGS: 'agri_readings_v1',
  ALERTS: 'agri_alerts_v1',
  ACTIVITIES: 'agri_activities_v1',
  PESTS: 'agri_pests_v1',
  FERTILIZERS: 'agri_fertilizers_v1',
  HARVESTS: 'agri_harvests_v1',
  // Sensitive keys (Encrypted with AES-GCM 256)
  SALES_ENC: 'agri_sales_enc_v1',
  EXPENSES_ENC: 'agri_expenses_enc_v1',
  USERS_ENC: 'agri_users_enc_v1',
  CURRENT_USER: 'agri_current_user_v1',
  RULES_CONFIG: 'agri_rules_config_v1',
  SYNC_QUEUE: 'agri_sync_queue_v1',
  SYNC_LOGS: 'agri_sync_logs_v1',
  LAST_SYNC_TIME: 'agri_last_sync_time_v1',
  SIMULATED_OFFLINE: 'agri_simulated_offline_v1',
};

// Seed Data
const INITIAL_FARMS: Farm[] = [
  {
    id: 'farm-1',
    name: 'Highland Agriventure Farm',
    location: 'Sector 4, Green Valley Basin',
    totalArea: 25.5,
    areaUnit: 'acres',
    notes: 'Primary commercial farm focusing on maize, tomato, and horticultural cash crops.',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'farm-2',
    name: 'Riverbend Homestead Plots',
    location: 'Lower River Ridge Road',
    totalArea: 12.0,
    areaUnit: 'acres',
    notes: 'Secondary plot dedicated to legumes and seasonal cassava tubers.',
    createdAt: '2026-02-10T09:30:00.000Z',
  },
];

const INITIAL_PLOTS: Plot[] = [
  {
    id: 'plot-1',
    farmId: 'farm-1',
    name: 'Plot A - North Terrace (Maize)',
    size: 10.0,
    soilType: 'Loam',
    irrigationType: 'Drip',
    notes: 'Rich organic matter loam soil with drip irrigation lines installed.',
    createdAt: '2026-01-16T10:00:00.000Z',
  },
  {
    id: 'plot-2',
    farmId: 'farm-1',
    name: 'Plot B - South Greenhouse (Tomato)',
    size: 5.5,
    soilType: 'Clay-Loam',
    irrigationType: 'Drip',
    notes: 'High yield hybrid tomato canopy under managed fertigation.',
    createdAt: '2026-01-18T11:00:00.000Z',
  },
  {
    id: 'plot-3',
    farmId: 'farm-1',
    name: 'Plot C - East Slope (Sweet Pepper)',
    size: 4.0,
    soilType: 'Sandy',
    irrigationType: 'Sprinkler',
    notes: 'Fast draining sandy soil; requires frequent moisture monitoring.',
    createdAt: '2026-02-01T14:00:00.000Z',
  },
  {
    id: 'plot-4',
    farmId: 'farm-2',
    name: 'Plot D - River Terrace (Cassava)',
    size: 8.0,
    soilType: 'Loam',
    irrigationType: 'Manual / Rainfed',
    notes: 'Rainfed plot with supplemental furrow watering as needed.',
    createdAt: '2026-02-15T09:00:00.000Z',
  },
];

const INITIAL_CROPS: Crop[] = [
  {
    id: 'crop-1',
    plotId: 'plot-1',
    name: 'Hybrid Yellow Maize',
    variety: 'Pioneer 30Y87',
    plantingDate: '2026-02-01',
    expectedHarvestDate: '2026-05-20',
    growthStage: 'Flowering',
    healthStatus: 'Healthy',
    targetMoistureMin: 40,
    targetMoistureMax: 70,
    targetTempMin: 18,
    targetTempMax: 32,
    notes: 'Tasseling stage. Water stress at this stage will reduce grain fill.',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'crop-2',
    plotId: 'plot-2',
    name: 'Roma Hybrid Tomato',
    variety: 'Rio Grande High-Yield',
    plantingDate: '2026-01-20',
    expectedHarvestDate: '2026-04-12',
    growthStage: 'Fruiting',
    healthStatus: 'Needs Attention',
    targetMoistureMin: 45,
    targetMoistureMax: 75,
    targetTempMin: 20,
    targetTempMax: 30,
    notes: 'Heavy fruit set; requires steady moisture to prevent blossom end rot.',
    createdAt: '2026-01-20T11:00:00.000Z',
  },
  {
    id: 'crop-3',
    plotId: 'plot-3',
    name: 'Bell Pepper (California Wonder)',
    variety: 'Golden Sweet',
    plantingDate: '2026-02-15',
    expectedHarvestDate: '2026-05-05',
    growthStage: 'Vegetative',
    healthStatus: 'Healthy',
    targetMoistureMin: 38,
    targetMoistureMax: 68,
    targetTempMin: 18,
    targetTempMax: 30,
    notes: 'Vegetative leaf development on sandy soil plot.',
    createdAt: '2026-02-15T12:00:00.000Z',
  },
  {
    id: 'crop-4',
    plotId: 'plot-4',
    name: 'Improved Cassava Tubers',
    variety: 'TME 419 Early Maturity',
    plantingDate: '2025-11-10',
    expectedHarvestDate: '2026-04-10', // Approaching in 3 days!
    growthStage: 'Harvest Ready',
    healthStatus: 'Good',
    targetMoistureMin: 30,
    targetMoistureMax: 65,
    targetTempMin: 22,
    targetTempMax: 35,
    notes: 'Starch accumulation complete. Ready for initial harvesting.',
    createdAt: '2025-11-10T08:00:00.000Z',
  },
];

const INITIAL_READINGS: SensorReading[] = [
  {
    id: 'read-1',
    plotId: 'plot-1',
    soilMoisture: 32, // triggers Low Moisture Alert!
    temperature: 31.5,
    humidity: 58,
    rainfall: 0,
    recordedAt: '2026-04-07T06:15:00.000Z',
    source: 'manual',
    notes: 'Morning field inspection with digital soil probe.',
    synced: true,
  },
  {
    id: 'read-2',
    plotId: 'plot-2',
    soilMoisture: 48,
    temperature: 28.2,
    humidity: 72,
    rainfall: 0,
    recordedAt: '2026-04-07T06:30:00.000Z',
    source: 'manual',
    notes: 'Drip line operating normally.',
    synced: true,
  },
  {
    id: 'read-3',
    plotId: 'plot-3',
    soilMoisture: 24, // triggers Critical Low Moisture Alert!
    temperature: 36.2, // triggers Heat stress alert!
    humidity: 42,
    rainfall: 0,
    recordedAt: '2026-04-07T06:45:00.000Z',
    source: 'manual',
    notes: 'East slope sandy soil dried out rapidly overnight.',
    synced: true,
  },
  {
    id: 'read-4',
    plotId: 'plot-4',
    soilMoisture: 52,
    temperature: 29.0,
    humidity: 65,
    rainfall: 4.5,
    recordedAt: '2026-04-06T17:00:00.000Z',
    source: 'manual',
    notes: 'After brief afternoon shower.',
    synced: true,
  },
];

const INITIAL_ALERTS: IrrigationAlert[] = [
  {
    id: 'alert-initial-1',
    plotId: 'plot-3',
    cropId: 'crop-3',
    title: '🚨 Critical Low Soil Moisture',
    message: 'Soil moisture in Plot C - East Slope has dropped to 24%, below the 25% critical threshold.',
    recommendation: 'Turn on sprinkler irrigation immediately for 45 minutes to avoid vegetative stunt in Bell Peppers.',
    ruleCode: 'RULE_CRITICAL_LOW_MOISTURE',
    severity: 'critical',
    status: 'active',
    timestamp: '2026-04-07T06:45:00.000Z',
  },
  {
    id: 'alert-initial-2',
    plotId: 'plot-1',
    cropId: 'crop-1',
    title: '💧 Irrigation Recommended',
    message: 'Soil moisture in Plot A is at 32%, below optimal 35% minimum.',
    recommendation: 'Maize is at flowering stage. Schedule drip fertigation cycle early morning.',
    ruleCode: 'RULE_LOW_MOISTURE',
    severity: 'warning',
    status: 'active',
    timestamp: '2026-04-07T06:15:00.000Z',
  },
  {
    id: 'alert-initial-3',
    plotId: 'plot-4',
    cropId: 'crop-4',
    title: '🌾 Upcoming Harvest: Improved Cassava Tubers',
    message: 'TME 419 Early Maturity cassava harvest is scheduled for 2026-04-10 (3 days away).',
    recommendation: 'Coordinate field harvesting crew and inspect collection sacks.',
    ruleCode: 'RULE_HARVEST_APPROACHING',
    severity: 'info',
    status: 'active',
    timestamp: '2026-04-07T05:00:00.000Z',
  },
];

const INITIAL_ACTIVITIES: FarmActivity[] = [
  {
    id: 'act-1',
    plotId: 'plot-3',
    cropId: 'crop-3',
    title: 'Immediate Sprinkler Irrigation',
    activityType: 'Watering',
    scheduledDate: '2026-04-07',
    priority: 'Urgent',
    status: 'Pending',
    notes: 'Respond to critical low moisture sensor reading (24%).',
    createdAt: '2026-04-07T06:45:00.000Z',
  },
  {
    id: 'act-2',
    plotId: 'plot-2',
    cropId: 'crop-2',
    title: 'Apply Calcium Nitrate Foliar Spray',
    activityType: 'Fertilizing',
    scheduledDate: '2026-04-08',
    priority: 'High',
    status: 'Pending',
    notes: 'Strengthen fruit skin against blossom end rot in tomatoes.',
    createdAt: '2026-04-06T10:00:00.000Z',
  },
  {
    id: 'act-3',
    plotId: 'plot-1',
    cropId: 'crop-1',
    title: 'Scout for Fall Armyworm Eggs',
    activityType: 'Inspection',
    scheduledDate: '2026-04-07',
    priority: 'Medium',
    status: 'In Progress',
    notes: 'Check under leaf whorls in northern quadrant.',
    createdAt: '2026-04-05T08:00:00.000Z',
  },
  {
    id: 'act-4',
    plotId: 'plot-4',
    cropId: 'crop-4',
    title: 'Tuber Harvest Operation (Batch 1)',
    activityType: 'Harvesting',
    scheduledDate: '2026-04-10',
    priority: 'High',
    status: 'Pending',
    notes: 'Prepare harvest tools and collection trucks.',
    createdAt: '2026-04-04T09:00:00.000Z',
  },
  {
    id: 'act-5',
    plotId: 'plot-1',
    cropId: 'crop-1',
    title: 'Weeding Along Furrow Rows',
    activityType: 'Weeding',
    scheduledDate: '2026-04-02',
    priority: 'Medium',
    status: 'Completed',
    notes: 'Manual weeding completed by field crew.',
    completedAt: '2026-04-02T16:00:00.000Z',
    createdAt: '2026-04-01T08:00:00.000Z',
  },
];

const INITIAL_PESTS: PestDiseaseReport[] = [
  {
    id: 'pest-1',
    cropId: 'crop-2',
    plotId: 'plot-2',
    issueType: 'disease',
    name: 'Early Blight (Alternaria solani)',
    symptoms: 'Concentric ring brown spots on lower leaves with yellow halo.',
    severity: 'Moderate',
    observedDate: '2026-04-05',
    treatmentApplied: 'Pruned affected lower leaves; copper-based organic spray.',
    recommendedTreatment: 'Maintain foliage aeration; avoid overhead sprinkler wetting.',
    status: 'Under Treatment',
    notes: 'Spotted after consecutive warm humid days.',
    createdAt: '2026-04-05T11:00:00.000Z',
  },
  {
    id: 'pest-2',
    cropId: 'crop-1',
    plotId: 'plot-1',
    issueType: 'pest',
    name: 'Corn Earworm / Armyworm Larvae',
    symptoms: 'Small pinholes and window-pane feeding on leaf whorls.',
    severity: 'Mild',
    observedDate: '2026-04-03',
    treatmentApplied: 'Application of Neem oil extract and Bacillus thuringiensis (Bt).',
    recommendedTreatment: 'Deploy pheromone traps and monitor pupae emergence.',
    status: 'Active',
    notes: 'Limited to boundary rows near tree line.',
    createdAt: '2026-04-03T09:30:00.000Z',
  },
];

const INITIAL_FERTILIZERS: FertilizerRecord[] = [
  {
    id: 'fert-1',
    plotId: 'plot-1',
    cropId: 'crop-1',
    fertilizerName: 'NPK 15-15-15 Compound',
    applicationDate: '2026-02-20',
    quantity: 150,
    unit: 'kg',
    applicationMethod: 'Band placement',
    cost: 120,
    notes: 'Basal dressing applied alongside maize ridges.',
    createdAt: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 'fert-2',
    plotId: 'plot-1',
    cropId: 'crop-1',
    fertilizerName: 'Granular Urea (46-0-0)',
    applicationDate: '2026-03-15',
    quantity: 100,
    unit: 'kg',
    applicationMethod: 'Broadcasting',
    cost: 85,
    notes: 'Top dressing during vegetative knee-high stage.',
    createdAt: '2026-03-15T11:00:00.000Z',
  },
  {
    id: 'fert-3',
    plotId: 'plot-2',
    cropId: 'crop-2',
    fertilizerName: 'Water Soluble NPK 19-19-19 + TE',
    applicationDate: '2026-03-25',
    quantity: 40,
    unit: 'kg',
    applicationMethod: 'Drip fertigation',
    cost: 95,
    notes: 'Injected into tomato drip irrigation lines.',
    createdAt: '2026-03-25T08:30:00.000Z',
  },
];

const INITIAL_HARVESTS: HarvestRecord[] = [
  {
    id: 'harv-1',
    cropId: 'crop-2',
    plotId: 'plot-2',
    harvestDate: '2026-03-28',
    quantity: 650,
    unit: 'kg',
    qualityGrade: 'Grade A',
    marketEstimatedValue: 975,
    notes: 'First picking of vine-ripened Roma tomatoes. High firm quality.',
    createdAt: '2026-03-28T16:00:00.000Z',
  },
  {
    id: 'harv-2',
    cropId: 'crop-2',
    plotId: 'plot-2',
    harvestDate: '2026-04-04',
    quantity: 820,
    unit: 'kg',
    qualityGrade: 'Grade A',
    marketEstimatedValue: 1230,
    notes: 'Second main picking; distributed to local supermarket cooperative.',
    createdAt: '2026-04-04T15:30:00.000Z',
  },
];

// Sensitive items: Sales and Expenses (Encrypted locally)
const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-1',
    harvestId: 'harv-1',
    cropName: 'Roma Hybrid Tomato',
    saleDate: '2026-03-29',
    buyerName: 'Fresh Valley Wholesale Market',
    quantity: 600,
    unit: 'kg',
    unitPrice: 1.5,
    totalRevenue: 900,
    paymentStatus: 'Received',
    notes: 'Direct delivery at loading bay 3. Cash on delivery invoice #FV-8821.',
    createdAt: '2026-03-29T10:00:00.000Z',
  },
  {
    id: 'sale-2',
    harvestId: 'harv-2',
    cropName: 'Roma Hybrid Tomato',
    saleDate: '2026-04-05',
    buyerName: 'Metro Food Processors Ltd',
    quantity: 800,
    unit: 'kg',
    unitPrice: 1.6,
    totalRevenue: 1280,
    paymentStatus: 'Received',
    notes: 'Grade A supply contract delivery. Bank wire ref: METRO-2026-44.',
    createdAt: '2026-04-05T14:00:00.000Z',
  },
];

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    plotId: 'plot-1',
    category: 'Seeds/Seedlings',
    expenseDate: '2026-01-25',
    amount: 180,
    description: 'Certified Pioneer hybrid maize seed bags (x4)',
    vendor: 'AgroSeed Supply Hub',
    receiptNumber: 'RCP-10492',
    notes: 'High germination rate lot #A9.',
    createdAt: '2026-01-25T09:00:00.000Z',
  },
  {
    id: 'exp-2',
    plotId: 'plot-1',
    category: 'Fertilizer',
    expenseDate: '2026-02-18',
    amount: 205,
    description: 'NPK 15-15-15 and Granular Urea fertilizers',
    vendor: 'FarmChem Ltd',
    receiptNumber: 'RCP-10822',
    notes: 'Bulk purchase discount applied.',
    createdAt: '2026-02-18T11:00:00.000Z',
  },
  {
    id: 'exp-3',
    plotId: 'plot-2',
    category: 'Labor',
    expenseDate: '2026-03-28',
    amount: 150,
    description: 'Tomato harvesting and sorting field labor crew (3 workers)',
    vendor: 'Highland Agricultural Labor Group',
    receiptNumber: 'LAB-042',
    notes: 'Paid daily wages upon completion.',
    createdAt: '2026-03-28T18:00:00.000Z',
  },
  {
    id: 'exp-4',
    plotId: 'plot-3',
    category: 'Irrigation/Fuel',
    expenseDate: '2026-04-01',
    amount: 75,
    description: 'Diesel fuel for water pump generator (50 Liters)',
    vendor: 'Green Valley Energy Station',
    receiptNumber: 'FUEL-8901',
    notes: 'Fuel storage tank refilled.',
    createdAt: '2026-04-01T14:30:00.000Z',
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'David Okafor',
    email: 'farmer.david@agrismart.org',
    role: 'farmer',
    phone: '+1 (555) 234-8901',
    farmIds: ['farm-1', 'farm-2'],
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Dr. Helen Vance (Admin)',
    email: 'admin.vance@agrismart.org',
    role: 'admin',
    phone: '+1 (555) 876-5432',
    farmIds: ['farm-1', 'farm-2'],
    createdAt: '2026-01-05T08:00:00.000Z',
  },
];

class StorageService {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOffline = false;

  constructor() {
    this.initSyncStatus();
    this.seedIfEmpty();
  }

  private initSyncStatus() {
    if (typeof window !== 'undefined') {
      const sim = localStorage.getItem(KEYS.SIMULATED_OFFLINE);
      this.isSimulatedOffline = sim === 'true';

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.dispatchNetworkEvent();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.dispatchNetworkEvent();
      });
    }
  }

  public getEffectiveOnlineStatus(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public setSimulatedOffline(isSimulated: boolean) {
    this.isSimulatedOffline = isSimulated;
    localStorage.setItem(KEYS.SIMULATED_OFFLINE, isSimulated ? 'true' : 'false');
    this.dispatchNetworkEvent();
  }

  public isSimulatedOfflineMode(): boolean {
    return this.isSimulatedOffline;
  }

  private dispatchNetworkEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agrismart:network_change', {
        detail: { isOnline: this.getEffectiveOnlineStatus() }
      }));
    }
  }

  private async seedIfEmpty() {
    if (typeof localStorage === 'undefined') return;

    if (!localStorage.getItem(KEYS.FARMS)) {
      localStorage.setItem(KEYS.FARMS, JSON.stringify(INITIAL_FARMS));
    }
    if (!localStorage.getItem(KEYS.PLOTS)) {
      localStorage.setItem(KEYS.PLOTS, JSON.stringify(INITIAL_PLOTS));
    }
    if (!localStorage.getItem(KEYS.CROPS)) {
      localStorage.setItem(KEYS.CROPS, JSON.stringify(INITIAL_CROPS));
    }
    if (!localStorage.getItem(KEYS.READINGS)) {
      localStorage.setItem(KEYS.READINGS, JSON.stringify(INITIAL_READINGS));
    }
    if (!localStorage.getItem(KEYS.ALERTS)) {
      localStorage.setItem(KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    }
    if (!localStorage.getItem(KEYS.ACTIVITIES)) {
      localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    }
    if (!localStorage.getItem(KEYS.PESTS)) {
      localStorage.setItem(KEYS.PESTS, JSON.stringify(INITIAL_PESTS));
    }
    if (!localStorage.getItem(KEYS.FERTILIZERS)) {
      localStorage.setItem(KEYS.FERTILIZERS, JSON.stringify(INITIAL_FERTILIZERS));
    }
    if (!localStorage.getItem(KEYS.HARVESTS)) {
      localStorage.setItem(KEYS.HARVESTS, JSON.stringify(INITIAL_HARVESTS));
    }
    if (!localStorage.getItem(KEYS.RULES_CONFIG)) {
      localStorage.setItem(KEYS.RULES_CONFIG, JSON.stringify(DEFAULT_RULES_CONFIG));
    }
    if (!localStorage.getItem(KEYS.CURRENT_USER)) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    }
    if (!localStorage.getItem(KEYS.LAST_SYNC_TIME)) {
      localStorage.setItem(KEYS.LAST_SYNC_TIME, new Date().toISOString());
    }

    // Encrypt sensitive seed collections with AES-GCM
    if (!localStorage.getItem(KEYS.SALES_ENC)) {
      const encSales = await encryptSensitiveData(INITIAL_SALES);
      localStorage.setItem(KEYS.SALES_ENC, encSales);
    }
    if (!localStorage.getItem(KEYS.EXPENSES_ENC)) {
      const encExpenses = await encryptSensitiveData(INITIAL_EXPENSES);
      localStorage.setItem(KEYS.EXPENSES_ENC, encExpenses);
    }
    if (!localStorage.getItem(KEYS.USERS_ENC)) {
      const encUsers = await encryptSensitiveData(INITIAL_USERS);
      localStorage.setItem(KEYS.USERS_ENC, encUsers);
    }
  }

  // --- Queue helper ---
  private queueItem(entityType: SyncQueueItem['entityType'], action: SyncQueueItem['action'], payload: any) {
    const queue = this.getSyncQueue();
    const item: SyncQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType,
      action,
      payload,
      queuedAt: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    };
    queue.push(item);
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    this.dispatchSyncEvent();
  }

  public getSyncQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(KEYS.SYNC_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public clearSyncQueue() {
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
    this.dispatchSyncEvent();
  }

  private dispatchSyncEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agrismart:sync_queue_change'));
    }
  }

  // --- FARMS ---
  public getFarms(): Farm[] {
    const raw = localStorage.getItem(KEYS.FARMS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveFarm(farm: Farm): Farm {
    const farms = this.getFarms();
    const existingIndex = farms.findIndex(f => f.id === farm.id);
    if (existingIndex >= 0) {
      farms[existingIndex] = farm;
      this.queueItem('farm', 'update', farm);
    } else {
      farms.push(farm);
      this.queueItem('farm', 'create', farm);
    }
    localStorage.setItem(KEYS.FARMS, JSON.stringify(farms));
    return farm;
  }

  public deleteFarm(farmId: string): void {
    const farms = this.getFarms().filter(f => f.id !== farmId);
    localStorage.setItem(KEYS.FARMS, JSON.stringify(farms));
    this.queueItem('farm', 'delete', { id: farmId });
  }

  // --- PLOTS ---
  public getPlots(): Plot[] {
    const raw = localStorage.getItem(KEYS.PLOTS);
    return raw ? JSON.parse(raw) : [];
  }

  public savePlot(plot: Plot): Plot {
    const plots = this.getPlots();
    const existingIndex = plots.findIndex(p => p.id === plot.id);
    if (existingIndex >= 0) {
      plots[existingIndex] = plot;
      this.queueItem('plot', 'update', plot);
    } else {
      plots.push(plot);
      this.queueItem('plot', 'create', plot);
    }
    localStorage.setItem(KEYS.PLOTS, JSON.stringify(plots));
    return plot;
  }

  public deletePlot(plotId: string): void {
    const plots = this.getPlots().filter(p => p.id !== plotId);
    localStorage.setItem(KEYS.PLOTS, JSON.stringify(plots));
    this.queueItem('plot', 'delete', { id: plotId });
  }

  // --- CROPS ---
  public getCrops(): Crop[] {
    const raw = localStorage.getItem(KEYS.CROPS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveCrop(crop: Crop): Crop {
    const crops = this.getCrops();
    const existingIndex = crops.findIndex(c => c.id === crop.id);
    if (existingIndex >= 0) {
      crops[existingIndex] = crop;
      this.queueItem('crop', 'update', crop);
    } else {
      crops.push(crop);
      this.queueItem('crop', 'create', crop);
    }
    localStorage.setItem(KEYS.CROPS, JSON.stringify(crops));
    return crop;
  }

  public deleteCrop(cropId: string): void {
    const crops = this.getCrops().filter(c => c.id !== cropId);
    localStorage.setItem(KEYS.CROPS, JSON.stringify(crops));
    this.queueItem('crop', 'delete', { id: cropId });
  }

  // --- READINGS ---
  public getReadings(): SensorReading[] {
    const raw = localStorage.getItem(KEYS.READINGS);
    return raw ? JSON.parse(raw) : [];
  }

  public addReading(reading: SensorReading): SensorReading {
    const readings = this.getReadings();
    readings.unshift(reading); // newest first
    localStorage.setItem(KEYS.READINGS, JSON.stringify(readings));
    this.queueItem('reading', 'create', reading);
    return reading;
  }

  public deleteReading(readingId: string): void {
    const readings = this.getReadings().filter(r => r.id !== readingId);
    localStorage.setItem(KEYS.READINGS, JSON.stringify(readings));
  }

  // --- ALERTS ---
  public getAlerts(): IrrigationAlert[] {
    const raw = localStorage.getItem(KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  }

  public addAlert(alert: IrrigationAlert): IrrigationAlert {
    const alerts = this.getAlerts();
    // avoid duplicates of same active rule on same plot within 1 hour
    const exists = alerts.some(
      a => a.plotId === alert.plotId && a.ruleCode === alert.ruleCode && a.status === 'active'
    );
    if (!exists) {
      alerts.unshift(alert);
      localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    }
    return alert;
  }

  public updateAlertStatus(alertId: string, status: 'active' | 'acknowledged' | 'resolved'): void {
    const alerts = this.getAlerts();
    const target = alerts.find(a => a.id === alertId);
    if (target) {
      target.status = status;
      localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    }
  }

  public dismissAlert(alertId: string): void {
    this.updateAlertStatus(alertId, 'resolved');
  }

  // --- ACTIVITIES ---
  public getActivities(): FarmActivity[] {
    const raw = localStorage.getItem(KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : [];
  }

  public saveActivity(activity: FarmActivity): FarmActivity {
    const activities = this.getActivities();
    const idx = activities.findIndex(a => a.id === activity.id);
    if (idx >= 0) {
      activities[idx] = activity;
      this.queueItem('activity', 'update', activity);
    } else {
      activities.unshift(activity);
      this.queueItem('activity', 'create', activity);
    }
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));
    return activity;
  }

  public deleteActivity(id: string): void {
    const activities = this.getActivities().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));
    this.queueItem('activity', 'delete', { id });
  }

  // --- PEST REPORTS ---
  public getPestReports(): PestDiseaseReport[] {
    const raw = localStorage.getItem(KEYS.PESTS);
    return raw ? JSON.parse(raw) : [];
  }

  public savePestReport(report: PestDiseaseReport): PestDiseaseReport {
    const reports = this.getPestReports();
    const idx = reports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      reports[idx] = report;
      this.queueItem('pest', 'update', report);
    } else {
      reports.unshift(report);
      this.queueItem('pest', 'create', report);
    }
    localStorage.setItem(KEYS.PESTS, JSON.stringify(reports));
    return report;
  }

  public deletePestReport(id: string): void {
    const reports = this.getPestReports().filter(r => r.id !== id);
    localStorage.setItem(KEYS.PESTS, JSON.stringify(reports));
    this.queueItem('pest', 'delete', { id });
  }

  // --- FERTILIZER RECORDS ---
  public getFertilizerRecords(): FertilizerRecord[] {
    const raw = localStorage.getItem(KEYS.FERTILIZERS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveFertilizerRecord(record: FertilizerRecord): FertilizerRecord {
    const records = this.getFertilizerRecords();
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      records[idx] = record;
      this.queueItem('fertilizer', 'update', record);
    } else {
      records.unshift(record);
      this.queueItem('fertilizer', 'create', record);
    }
    localStorage.setItem(KEYS.FERTILIZERS, JSON.stringify(records));
    return record;
  }

  public deleteFertilizerRecord(id: string): void {
    const records = this.getFertilizerRecords().filter(r => r.id !== id);
    localStorage.setItem(KEYS.FERTILIZERS, JSON.stringify(records));
    this.queueItem('fertilizer', 'delete', { id });
  }

  // --- HARVEST RECORDS ---
  public getHarvestRecords(): HarvestRecord[] {
    const raw = localStorage.getItem(KEYS.HARVESTS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveHarvestRecord(record: HarvestRecord): HarvestRecord {
    const records = this.getHarvestRecords();
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      records[idx] = record;
      this.queueItem('harvest', 'update', record);
    } else {
      records.unshift(record);
      this.queueItem('harvest', 'create', record);
    }
    localStorage.setItem(KEYS.HARVESTS, JSON.stringify(records));
    return record;
  }

  public deleteHarvestRecord(id: string): void {
    const records = this.getHarvestRecords().filter(r => r.id !== id);
    localStorage.setItem(KEYS.HARVESTS, JSON.stringify(records));
    this.queueItem('harvest', 'delete', { id });
  }

  // --- ENCRYPTED SENSITIVE RECORDS: SALES ---
  public async getSalesRecords(): Promise<SaleRecord[]> {
    const raw = localStorage.getItem(KEYS.SALES_ENC);
    if (!raw) return [];
    try {
      if (isEncryptedEnvelope(raw)) {
        return await decryptSensitiveData<SaleRecord[]>(raw);
      }
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to decrypt sales, attempting fallback', err);
      return [];
    }
  }

  public async saveSaleRecord(record: SaleRecord): Promise<SaleRecord> {
    const sales = await this.getSalesRecords();
    const idx = sales.findIndex(s => s.id === record.id);
    if (idx >= 0) {
      sales[idx] = record;
      this.queueItem('sale', 'update', record);
    } else {
      sales.unshift(record);
      this.queueItem('sale', 'create', record);
    }
    const encrypted = await encryptSensitiveData(sales);
    localStorage.setItem(KEYS.SALES_ENC, encrypted);
    return record;
  }

  public async deleteSaleRecord(id: string): Promise<void> {
    const sales = (await this.getSalesRecords()).filter(s => s.id !== id);
    const encrypted = await encryptSensitiveData(sales);
    localStorage.setItem(KEYS.SALES_ENC, encrypted);
    this.queueItem('sale', 'delete', { id });
  }

  // --- ENCRYPTED SENSITIVE RECORDS: EXPENSES ---
  public async getExpenses(): Promise<ExpenseRecord[]> {
    const raw = localStorage.getItem(KEYS.EXPENSES_ENC);
    if (!raw) return [];
    try {
      if (isEncryptedEnvelope(raw)) {
        return await decryptSensitiveData<ExpenseRecord[]>(raw);
      }
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to decrypt expenses', err);
      return [];
    }
  }

  public async saveExpense(record: ExpenseRecord): Promise<ExpenseRecord> {
    const expenses = await this.getExpenses();
    const idx = expenses.findIndex(e => e.id === record.id);
    if (idx >= 0) {
      expenses[idx] = record;
      this.queueItem('expense', 'update', record);
    } else {
      expenses.unshift(record);
      this.queueItem('expense', 'create', record);
    }
    const encrypted = await encryptSensitiveData(expenses);
    localStorage.setItem(KEYS.EXPENSES_ENC, encrypted);
    return record;
  }

  public async deleteExpense(id: string): Promise<void> {
    const expenses = (await this.getExpenses()).filter(e => e.id !== id);
    const encrypted = await encryptSensitiveData(expenses);
    localStorage.setItem(KEYS.EXPENSES_ENC, encrypted);
    this.queueItem('expense', 'delete', { id });
  }

  // --- ENCRYPTED USERS & AUTH ---
  public async getUsers(): Promise<User[]> {
    const raw = localStorage.getItem(KEYS.USERS_ENC);
    if (!raw) return INITIAL_USERS;
    try {
      if (isEncryptedEnvelope(raw)) {
        return await decryptSensitiveData<User[]>(raw);
      }
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to decrypt users', err);
      return INITIAL_USERS;
    }
  }

  public async saveUser(user: User): Promise<User> {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
      this.queueItem('user', 'update', user);
    } else {
      users.push(user);
      this.queueItem('user', 'create', user);
    }
    const encrypted = await encryptSensitiveData(users);
    localStorage.setItem(KEYS.USERS_ENC, encrypted);

    // If current user, update
    const current = this.getCurrentUser();
    if (current?.id === user.id) {
      this.setCurrentUser(user);
    }
    return user;
  }

  public getCurrentUser(): User {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  }

  public setCurrentUser(user: User): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agrismart:user_change', { detail: user }));
    }
  }

  // --- RULES CONFIG ---
  public getRulesConfig(): DecisionRulesConfig {
    const raw = localStorage.getItem(KEYS.RULES_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_RULES_CONFIG;
  }

  public saveRulesConfig(config: DecisionRulesConfig): DecisionRulesConfig {
    localStorage.setItem(KEYS.RULES_CONFIG, JSON.stringify(config));
    return config;
  }

  // --- SYNC AUDIT LOGS ---
  public getSyncLogs(): SyncAuditLog[] {
    const raw = localStorage.getItem(KEYS.SYNC_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public addSyncLog(log: SyncAuditLog) {
    const logs = this.getSyncLogs();
    logs.unshift(log);
    // keep max 50 logs
    if (logs.length > 50) logs.pop();
    localStorage.setItem(KEYS.SYNC_LOGS, JSON.stringify(logs));
  }

  public getLastSyncTime(): string {
    return localStorage.getItem(KEYS.LAST_SYNC_TIME) || new Date().toISOString();
  }

  public setLastSyncTime(timestamp: string) {
    localStorage.setItem(KEYS.LAST_SYNC_TIME, timestamp);
  }

  // --- INSPECTION & BACKUP ---
  public getRawStorageInspection() {
    return {
      salesEncryptedCiphertext: localStorage.getItem(KEYS.SALES_ENC) || '(Empty)',
      expensesEncryptedCiphertext: localStorage.getItem(KEYS.EXPENSES_ENC) || '(Empty)',
      usersEncryptedCiphertext: localStorage.getItem(KEYS.USERS_ENC) || '(Empty)',
      queueCount: this.getSyncQueue().length,
      lastSync: this.getLastSyncTime(),
      storageTotalKeys: Object.keys(localStorage).filter(k => k.startsWith('agri_')).length,
    };
  }

  public async exportEncryptedBackup(): Promise<string> {
    const backupData = {
      farms: this.getFarms(),
      plots: this.getPlots(),
      crops: this.getCrops(),
      readings: this.getReadings(),
      alerts: this.getAlerts(),
      activities: this.getActivities(),
      pests: this.getPestReports(),
      fertilizers: this.getFertilizerRecords(),
      harvests: this.getHarvestRecords(),
      sales: await this.getSalesRecords(),
      expenses: await this.getExpenses(),
      users: await this.getUsers(),
      rulesConfig: this.getRulesConfig(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return await encryptSensitiveData(backupData);
  }

  public async importEncryptedBackup(encryptedJsonString: string): Promise<boolean> {
    const data = await decryptSensitiveData<any>(encryptedJsonString);
    if (!data || !data.farms) throw new Error('Invalid backup schema');

    if (data.farms) localStorage.setItem(KEYS.FARMS, JSON.stringify(data.farms));
    if (data.plots) localStorage.setItem(KEYS.PLOTS, JSON.stringify(data.plots));
    if (data.crops) localStorage.setItem(KEYS.CROPS, JSON.stringify(data.crops));
    if (data.readings) localStorage.setItem(KEYS.READINGS, JSON.stringify(data.readings));
    if (data.alerts) localStorage.setItem(KEYS.ALERTS, JSON.stringify(data.alerts));
    if (data.activities) localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(data.activities));
    if (data.pests) localStorage.setItem(KEYS.PESTS, JSON.stringify(data.pests));
    if (data.fertilizers) localStorage.setItem(KEYS.FERTILIZERS, JSON.stringify(data.fertilizers));
    if (data.harvests) localStorage.setItem(KEYS.HARVESTS, JSON.stringify(data.harvests));
    if (data.sales) localStorage.setItem(KEYS.SALES_ENC, await encryptSensitiveData(data.sales));
    if (data.expenses) localStorage.setItem(KEYS.EXPENSES_ENC, await encryptSensitiveData(data.expenses));
    if (data.users) localStorage.setItem(KEYS.USERS_ENC, await encryptSensitiveData(data.users));
    if (data.rulesConfig) localStorage.setItem(KEYS.RULES_CONFIG, JSON.stringify(data.rulesConfig));

    return true;
  }
}

export const storage = new StorageService();
