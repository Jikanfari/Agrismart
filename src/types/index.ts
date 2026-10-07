export type Role = 'farmer' | 'admin' | 'agronomist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  farmIds: string[];
  createdAt: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  totalArea: number; // in acres
  areaUnit: 'acres' | 'hectares';
  notes?: string;
  createdAt: string;
}

export interface Plot {
  id: string;
  farmId: string;
  name: string;
  size: number;
  soilType: 'Loam' | 'Clay' | 'Sandy' | 'Silt' | 'Clay-Loam';
  irrigationType: 'Drip' | 'Sprinkler' | 'Furrow' | 'Manual / Rainfed';
  notes?: string;
  createdAt: string;
}

export type CropGrowthStage = 'Germination' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Maturation' | 'Harvest Ready';
export type CropHealthStatus = 'Healthy' | 'Good' | 'Needs Attention' | 'Stressed' | 'Infested';

export interface Crop {
  id: string;
  plotId: string;
  name: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: CropGrowthStage;
  healthStatus: CropHealthStatus;
  targetMoistureMin: number; // %
  targetMoistureMax: number; // %
  targetTempMin: number; // °C
  targetTempMax: number; // °C
  notes?: string;
  createdAt: string;
}

export interface SensorReading {
  id: string;
  plotId: string;
  soilMoisture: number; // percentage (0 - 100%)
  temperature: number; // °C
  humidity: number; // percentage (0 - 100%)
  rainfall: number; // mm
  recordedAt: string;
  source: 'manual' | 'iot_sensor';
  notes?: string;
  synced: boolean;
}

export type AlertSeverity = 'critical' | 'warning' | 'advisory' | 'info';

export interface IrrigationAlert {
  id: string;
  plotId: string;
  cropId?: string;
  title: string;
  message: string;
  recommendation: string;
  ruleCode: string; // e.g., 'RULE_LOW_MOISTURE', 'RULE_HIGH_TEMP'
  severity: AlertSeverity;
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
}

export interface PestDiseaseReport {
  id: string;
  cropId: string;
  plotId: string;
  issueType: 'pest' | 'disease' | 'weed' | 'deficiency';
  name: string; // e.g. Fall Armyworm, Tomato Blight, Aphids
  symptoms: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  observedDate: string;
  treatmentApplied?: string;
  recommendedTreatment?: string;
  status: 'Active' | 'Under Treatment' | 'Resolved';
  notes?: string;
  createdAt: string;
}

export type ActivityType = 'Watering' | 'Fertilizing' | 'Weeding' | 'Spraying' | 'Inspection' | 'Harvesting' | 'Land Preparation';
export type ActivityPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ActivityStatus = 'Pending' | 'In Progress' | 'Completed';

export interface FarmActivity {
  id: string;
  plotId: string;
  cropId?: string;
  title: string;
  activityType: ActivityType;
  scheduledDate: string;
  priority: ActivityPriority;
  status: ActivityStatus;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface FertilizerRecord {
  id: string;
  plotId: string;
  cropId?: string;
  fertilizerName: string; // e.g. NPK 15-15-15, Urea
  applicationDate: string;
  quantity: number;
  unit: 'kg' | 'liters' | 'bags';
  applicationMethod: 'Broadcasting' | 'Drip fertigation' | 'Foliar spray' | 'Band placement';
  cost: number; // in USD / currency
  notes?: string;
  createdAt: string;
}

export interface HarvestRecord {
  id: string;
  cropId: string;
  plotId: string;
  harvestDate: string;
  quantity: number;
  unit: 'kg' | 'bags' | 'crates' | 'metric tons';
  qualityGrade: 'Grade A' | 'Grade B' | 'Grade C';
  marketEstimatedValue: number;
  notes?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  harvestId?: string;
  cropName: string;
  saleDate: string;
  buyerName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalRevenue: number;
  paymentStatus: 'Received' | 'Pending' | 'Partial';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 'Seeds/Seedlings' | 'Fertilizer' | 'Labor' | 'Transportation' | 'Irrigation/Fuel' | 'Pesticides/Chemicals' | 'Equipment/Tools' | 'Land Lease/Other';

export interface ExpenseRecord {
  id: string;
  plotId?: string;
  category: ExpenseCategory;
  expenseDate: string;
  amount: number;
  description: string;
  vendor?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface DecisionRulesConfig {
  lowMoistureThreshold: number; // default 35% -> recommend irrigation
  criticalMoistureThreshold: number; // default 25% -> immediate urgent irrigation
  highMoistureThreshold: number; // default 80% -> waterlogging alert
  highTempThreshold: number; // default 34°C -> heat stress alert
  lowTempThreshold: number; // default 10°C -> cold stress alert
  highHumidityThreshold: number; // default 80% -> fungal/disease alert
  harvestDaysAdvanceAlert: number; // default 5 days
}

export interface SyncQueueItem {
  id: string;
  entityType: 'reading' | 'activity' | 'harvest' | 'sale' | 'expense' | 'pest' | 'fertilizer' | 'crop' | 'plot' | 'farm' | 'user';
  action: 'create' | 'update' | 'delete';
  payload: any;
  queuedAt: string;
  attempts: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface SyncAuditLog {
  id: string;
  timestamp: string;
  itemsSynced: number;
  direction: 'upload' | 'download' | 'bidirectional';
  status: 'success' | 'failed' | 'partial';
  details: string;
}

export type WeatherConditionType =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rainy'
  | 'heavy_rain'
  | 'thunderstorm';

export type HarvestSuitabilityRating = 'Optimal' | 'Caution' | 'Unsuitable';

export interface WeatherForecastDay {
  date: string;
  dayName: string;
  condition: WeatherConditionType;
  conditionLabel: string;
  tempHigh: number; // °C
  tempLow: number; // °C
  humidity: number; // %
  pop: number; // probability of precipitation %
  rainfallMm: number; // mm
  windSpeedKmh: number; // km/h
  evapotranspirationEt: number; // mm/day
  irrigationAdvice: string;
  harvestSuitability: HarvestSuitabilityRating;
  harvestAdvice: string;
}

export interface AuthSession {
  token: string;
  user: User;
  isLocked: boolean;
  pinHash?: string;
  hasPin: boolean;
  biometricEnabled: boolean;
  expiresAt: number;
}

export interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
  farmIds: string[];
  exp: number;
  iat: number;
  iss: string;
}

export interface DatabaseEnquiryOptions {
  queryType: 'sensor_timeseries' | 'plot_performance' | 'financial_ledger' | 'pest_epidemiology' | 'harvest_yield_matrix';
  plotId?: string;
  farmId?: string;
  dateRange: '7d' | '30d' | '90d' | 'all';
  bucketWindow?: 'raw' | 'hourly' | 'daily';
  categoryFilter?: string;
}

export interface DatabaseEnquiryResult {
  queryName: string;
  executionTimeMs: number;
  recordCount: number;
  timestamp: string;
  rows: any[];
  summaryStats?: Record<string, number | string>;
  appliedSecurityPolicy: string;
}

