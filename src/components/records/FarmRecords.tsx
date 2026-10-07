import React, { useState, useEffect } from 'react';
import {
  Calendar, Check, Plus, Trash2, Edit3, DollarSign, Sprout,
  ShieldCheck, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Filter, Clock, CheckCircle2, ChevronRight, Tag, QrCode
} from 'lucide-react';
import {
  FarmActivity, FertilizerRecord, HarvestRecord, SaleRecord, ExpenseRecord,
  PestDiseaseReport, Plot, Crop, ActivityType, ActivityPriority, ExpenseCategory
} from '../../types';
import { storage } from '../../services/storage';

interface FarmRecordsProps {
  plots: Plot[];
  crops: Crop[];
  activities: FarmActivity[];
  fertilizers: FertilizerRecord[];
  harvests: HarvestRecord[];
  pests: PestDiseaseReport[];
  onSaveActivity: (act: FarmActivity) => void;
  onDeleteActivity: (id: string) => void;
  onToggleActivityStatus: (id: string) => void;
  onSaveFertilizer: (f: FertilizerRecord) => void;
  onDeleteFertilizer: (id: string) => void;
  onSaveHarvest: (h: HarvestRecord) => void;
  onDeleteHarvest: (id: string) => void;
  onSavePest: (p: PestDiseaseReport) => void;
  onDeletePest: (id: string) => void;
  onReloadEncryptedRecords: () => void;
  onOpenQRScanner?: () => void;
}

type RecordTab = 'activities' | 'fertilizers' | 'harvests' | 'finances' | 'pests';

export const FarmRecords: React.FC<FarmRecordsProps> = ({
  plots,
  crops,
  activities,
  fertilizers,
  harvests,
  pests,
  onSaveActivity,
  onDeleteActivity,
  onToggleActivityStatus,
  onSaveFertilizer,
  onDeleteFertilizer,
  onSaveHarvest,
  onDeleteHarvest,
  onSavePest,
  onDeletePest,
  onReloadEncryptedRecords,
  onOpenQRScanner,
}) => {
  const [activeTab, setActiveTab] = useState<RecordTab>('activities');

  // Encrypted financial states
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoadingFinances, setIsLoadingFinances] = useState(true);

  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPestModal, setShowPestModal] = useState(false);

  // Form edit objects
  const [editingActivity, setEditingActivity] = useState<Partial<FarmActivity> | null>(null);
  const [editingFertilizer, setEditingFertilizer] = useState<Partial<FertilizerRecord> | null>(null);
  const [editingHarvest, setEditingHarvest] = useState<Partial<HarvestRecord> | null>(null);
  const [editingSale, setEditingSale] = useState<Partial<SaleRecord> | null>(null);
  const [editingExpense, setEditingExpense] = useState<Partial<ExpenseRecord> | null>(null);
  const [editingPest, setEditingPest] = useState<Partial<PestDiseaseReport> | null>(null);

  // Fetch encrypted financial records
  const loadEncryptedFinances = async () => {
    setIsLoadingFinances(true);
    try {
      const s = await storage.getSalesRecords();
      const e = await storage.getExpenses();
      setSales(s);
      setExpenses(e);
    } finally {
      setIsLoadingFinances(false);
    }
  };

  useEffect(() => {
    loadEncryptedFinances();
  }, []);

  // Financial summary
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Handlers
  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity?.title || !editingActivity?.plotId) return;

    const act: FarmActivity = {
      id: editingActivity.id || `act-${Date.now()}`,
      plotId: editingActivity.plotId,
      cropId: editingActivity.cropId,
      title: editingActivity.title,
      activityType: (editingActivity.activityType as ActivityType) || 'Watering',
      scheduledDate: editingActivity.scheduledDate || new Date().toISOString().slice(0, 10),
      priority: (editingActivity.priority as ActivityPriority) || 'Medium',
      status: (editingActivity.status as any) || 'Pending',
      notes: editingActivity.notes || '',
      createdAt: editingActivity.createdAt || new Date().toISOString(),
    };

    onSaveActivity(act);
    setShowActivityModal(false);
    setEditingActivity(null);
  };

  const handleFertilizerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFertilizer?.fertilizerName || !editingFertilizer?.plotId) return;

    const rec: FertilizerRecord = {
      id: editingFertilizer.id || `fert-${Date.now()}`,
      plotId: editingFertilizer.plotId,
      cropId: editingFertilizer.cropId,
      fertilizerName: editingFertilizer.fertilizerName,
      applicationDate: editingFertilizer.applicationDate || new Date().toISOString().slice(0, 10),
      quantity: Number(editingFertilizer.quantity) || 50,
      unit: (editingFertilizer.unit as any) || 'kg',
      applicationMethod: (editingFertilizer.applicationMethod as any) || 'Broadcasting',
      cost: Number(editingFertilizer.cost) || 0,
      notes: editingFertilizer.notes || '',
      createdAt: editingFertilizer.createdAt || new Date().toISOString(),
    };

    onSaveFertilizer(rec);
    setShowFertilizerModal(false);
    setEditingFertilizer(null);
  };

  const handleHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHarvest?.cropId || !editingHarvest?.plotId) return;

    const rec: HarvestRecord = {
      id: editingHarvest.id || `harv-${Date.now()}`,
      plotId: editingHarvest.plotId,
      cropId: editingHarvest.cropId,
      harvestDate: editingHarvest.harvestDate || new Date().toISOString().slice(0, 10),
      quantity: Number(editingHarvest.quantity) || 100,
      unit: (editingHarvest.unit as any) || 'kg',
      qualityGrade: (editingHarvest.qualityGrade as any) || 'Grade A',
      marketEstimatedValue: Number(editingHarvest.marketEstimatedValue) || 0,
      notes: editingHarvest.notes || '',
      createdAt: editingHarvest.createdAt || new Date().toISOString(),
    };

    onSaveHarvest(rec);
    setShowHarvestModal(false);
    setEditingHarvest(null);
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale?.buyerName || !editingSale?.cropName) return;

    const qty = Number(editingSale.quantity) || 1;
    const price = Number(editingSale.unitPrice) || 1;

    const sale: SaleRecord = {
      id: editingSale.id || `sale-${Date.now()}`,
      cropName: editingSale.cropName,
      saleDate: editingSale.saleDate || new Date().toISOString().slice(0, 10),
      buyerName: editingSale.buyerName,
      quantity: qty,
      unit: editingSale.unit || 'kg',
      unitPrice: price,
      totalRevenue: Number((qty * price).toFixed(2)),
      paymentStatus: (editingSale.paymentStatus as any) || 'Received',
      notes: editingSale.notes || '',
      createdAt: editingSale.createdAt || new Date().toISOString(),
    };

    await storage.saveSaleRecord(sale);
    await loadEncryptedFinances();
    onReloadEncryptedRecords();
    setShowSaleModal(false);
    setEditingSale(null);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense?.amount || !editingExpense?.description) return;

    const exp: ExpenseRecord = {
      id: editingExpense.id || `exp-${Date.now()}`,
      plotId: editingExpense.plotId,
      category: (editingExpense.category as ExpenseCategory) || 'Fertilizer',
      expenseDate: editingExpense.expenseDate || new Date().toISOString().slice(0, 10),
      amount: Number(editingExpense.amount) || 0,
      description: editingExpense.description,
      vendor: editingExpense.vendor || '',
      receiptNumber: editingExpense.receiptNumber || '',
      notes: editingExpense.notes || '',
      createdAt: editingExpense.createdAt || new Date().toISOString(),
    };

    await storage.saveExpense(exp);
    await loadEncryptedFinances();
    onReloadEncryptedRecords();
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  const handlePestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPest?.name || !editingPest?.cropId || !editingPest?.plotId) return;

    const p: PestDiseaseReport = {
      id: editingPest.id || `pest-${Date.now()}`,
      cropId: editingPest.cropId,
      plotId: editingPest.plotId,
      issueType: (editingPest.issueType as any) || 'pest',
      name: editingPest.name,
      symptoms: editingPest.symptoms || '',
      severity: (editingPest.severity as any) || 'Moderate',
      observedDate: editingPest.observedDate || new Date().toISOString().slice(0, 10),
      treatmentApplied: editingPest.treatmentApplied || '',
      recommendedTreatment: editingPest.recommendedTreatment || '',
      status: (editingPest.status as any) || 'Active',
      notes: editingPest.notes || '',
      createdAt: editingPest.createdAt || new Date().toISOString(),
    };

    onSavePest(p);
    setShowPestModal(false);
    setEditingPest(null);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'activities'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Activity Scheduler ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('fertilizers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'fertilizers'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Fertilizer Logs ({fertilizers.length})
          </button>
          <button
            onClick={() => setActiveTab('harvests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'harvests'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Harvest Yields ({harvests.length})
          </button>
          <button
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'finances'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Finances & Sales
          </button>
          <button
            onClick={() => setActiveTab('pests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'pests'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Pest & Disease ({pests.length})
          </button>

          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
              title="Scan Seed Packet or Fertilizer Bag QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Packet/Bag QR</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Farm Activity Schedule & Calendar
              </h3>
              <p className="text-xs text-stone-500">
                Watering, fertilizing, weeding, spraying, inspection, and harvesting tasks.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingActivity({
                  plotId: plots[0]?.id || '',
                  title: '',
                  activityType: 'Watering',
                  scheduledDate: new Date().toISOString().slice(0, 10),
                  priority: 'Medium',
                  status: 'Pending',
                  notes: '',
                });
                setShowActivityModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Schedule Task
            </button>
          </div>

          <div className="space-y-2.5">
            {activities.map((act) => {
              const plot = plots.find((p) => p.id === act.plotId);
              const isDone = act.status === 'Completed';

              return (
                <div
                  key={act.id}
                  className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 ${
                    isDone ? 'border-stone-200 bg-stone-50/50 opacity-75' : 'border-stone-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => onToggleActivityStatus(act.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 hover:border-emerald-600'
                      }`}
                      aria-label="Toggle completed"
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold text-stone-900 truncate ${isDone ? 'line-through text-stone-500' : ''}`}>
                        {act.title}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {act.activityType} · Plot: {plot?.name || 'All'} · Due: {act.scheduledDate}
                      </p>
                      {act.notes && (
                        <p className="text-[11px] text-stone-600 italic mt-1">{act.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        act.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : act.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {act.priority}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Delete this activity?')) onDeleteActivity(act.id);
                      }}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FERTILIZER LOGS TAB */}
      {activeTab === 'fertilizers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Fertilizer Application Log
              </h3>
              <p className="text-xs text-stone-500">
                Track compound, urea, and foliar fertilizer dosages, application method and costs.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingFertilizer({
                  plotId: plots[0]?.id || '',
                  fertilizerName: '',
                  applicationDate: new Date().toISOString().slice(0, 10),
                  quantity: 50,
                  unit: 'kg',
                  applicationMethod: 'Broadcasting',
                  cost: 60,
                  notes: '',
                });
                setShowFertilizerModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Log Fertilizer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fertilizers.map((rec) => {
              const plot = plots.find((p) => p.id === rec.plotId);
              return (
                <div key={rec.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{rec.fertilizerName}</h4>
                      <p className="text-[11px] text-stone-500">
                        {plot?.name || 'Plot'} · Applied: {rec.applicationDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Delete fertilizer record?')) onDeleteFertilizer(rec.id);
                      }}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Quantity</span>
                      <strong className="text-stone-900">{rec.quantity} {rec.unit}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Method</span>
                      <strong className="text-stone-900 truncate block">{rec.applicationMethod}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Cost</span>
                      <strong className="text-emerald-800">${rec.cost}</strong>
                    </div>
                  </div>

                  {rec.notes && <p className="mt-2 text-xs text-stone-600 italic">{rec.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. HARVEST YIELDS TAB */}
      {activeTab === 'harvests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Harvest Yield Records
              </h3>
              <p className="text-xs text-stone-500">
                Log crop harvests, output quantities, quality grades and market valuation.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingHarvest({
                  cropId: crops[0]?.id || '',
                  plotId: plots[0]?.id || '',
                  harvestDate: new Date().toISOString().slice(0, 10),
                  quantity: 250,
                  unit: 'kg',
                  qualityGrade: 'Grade A',
                  marketEstimatedValue: 350,
                  notes: '',
                });
                setShowHarvestModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Record Harvest
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {harvests.map((h) => {
              const crop = crops.find((c) => c.id === h.cropId);
              const plot = plots.find((p) => p.id === h.plotId);

              return (
                <div key={h.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{crop?.name || 'Crop'}</h4>
                      <p className="text-[11px] text-stone-500">
                        {plot?.name} · Harvested: {h.harvestDate}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {h.qualityGrade}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Total Quantity</span>
                      <strong className="text-stone-900 text-sm">{h.quantity} {h.unit}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Est. Market Value</span>
                      <strong className="text-emerald-800 text-sm">${h.marketEstimatedValue}</strong>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between items-center text-xs pt-2 border-t border-stone-100">
                    <span className="text-stone-500 italic">{h.notes || 'Normal picking batch'}</span>
                    <button
                      onClick={() => {
                        if (confirm('Delete harvest record?')) onDeleteHarvest(h.id);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. FINANCES TAB (ENCRYPTED) */}
      {activeTab === 'finances' && (
        <div className="space-y-4">
          {/* Financial Summary Cards */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 text-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Encrypted Financial Ledger (AES-256)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingSale({
                      cropName: crops[0]?.name || 'Roma Hybrid Tomato',
                      saleDate: new Date().toISOString().slice(0, 10),
                      buyerName: '',
                      quantity: 100,
                      unit: 'kg',
                      unitPrice: 2,
                      paymentStatus: 'Received',
                      notes: '',
                    });
                    setShowSaleModal(true);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  + Add Sale
                </button>
                <button
                  onClick={() => {
                    setEditingExpense({
                      plotId: plots[0]?.id || '',
                      category: 'Fertilizer',
                      expenseDate: new Date().toISOString().slice(0, 10),
                      amount: 50,
                      description: '',
                      vendor: '',
                      notes: '',
                    });
                    setShowExpenseModal(true);
                  }}
                  className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-xs font-semibold"
                >
                  + Add Expense
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-stone-800/80 rounded-xl">
                <p className="text-[11px] text-stone-400">Total Revenue (Sales)</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
                  ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-stone-400">{sales.length} transactions</span>
              </div>
              <div className="p-3 bg-stone-800/80 rounded-xl">
                <p className="text-[11px] text-stone-400">Total Farm Expenses</p>
                <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">
                  ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-stone-400">{expenses.length} expense entries</span>
              </div>
              <div className="p-3 bg-stone-800/80 rounded-xl">
                <p className="text-[11px] text-stone-400">Net Farm Profit</p>
                <p className={`text-xl sm:text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-stone-400">
                  {totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}% Margin` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Sales & Expenses sub-lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales Table */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                Produce Sales Records ({sales.length})
              </h4>
              <div className="space-y-2">
                {sales.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-stone-900">{s.cropName}</p>
                      <p className="text-[11px] text-stone-500">
                        Buyer: {s.buyerName} · {s.quantity} {s.unit} @ ${s.unitPrice}
                      </p>
                      <p className="text-[10px] text-stone-400">{s.saleDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-800">${s.totalRevenue}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {s.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                Operational Expenses ({expenses.length})
              </h4>
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-stone-900">{e.description}</p>
                      <p className="text-[11px] text-stone-500">
                        Category: {e.category} · {e.vendor ? `Vendor: ${e.vendor}` : ''}
                      </p>
                      <p className="text-[10px] text-stone-400">{e.expenseDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-rose-700">${e.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PESTS & DISEASE TAB */}
      {activeTab === 'pests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Pest & Crop Disease Reports
              </h3>
              <p className="text-xs text-stone-500">
                Field scouting symptom records, severity assessment, and treatment regimens.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPest({
                  plotId: plots[0]?.id || '',
                  cropId: crops[0]?.id || '',
                  issueType: 'pest',
                  name: '',
                  symptoms: '',
                  severity: 'Moderate',
                  observedDate: new Date().toISOString().slice(0, 10),
                  treatmentApplied: '',
                  recommendedTreatment: '',
                  status: 'Active',
                  notes: '',
                });
                setShowPestModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Report Issue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pests.map((p) => {
              const crop = crops.find((c) => c.id === p.cropId);
              const plot = plots.find((pl) => pl.id === p.plotId);

              return (
                <div key={p.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900">{p.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            p.severity === 'Severe'
                              ? 'bg-rose-100 text-rose-800'
                              : p.severity === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Crop: {crop?.name} · Plot: {plot?.name} · Observed: {p.observedDate}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-stone-50 text-xs">
                    <p className="font-semibold text-stone-800">Observed Symptoms:</p>
                    <p className="text-stone-600 mt-0.5">{p.symptoms}</p>
                  </div>

                  {p.treatmentApplied && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 text-xs">
                      <p className="font-semibold text-emerald-950">Treatment Applied:</p>
                      <p className="text-emerald-900 mt-0.5">{p.treatmentApplied}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-stone-100 flex justify-between items-center text-xs">
                    <span className="text-stone-400 capitalize">Type: {p.issueType}</span>
                    <button
                      onClick={() => {
                        if (confirm('Delete pest observation report?')) onDeletePest(p.id);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ACTIVITY */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleActivitySubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">Schedule Farm Activity</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drip Line Flushing & Irrigation"
                  value={editingActivity?.title || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Plot *</label>
                  <select
                    required
                    value={editingActivity?.plotId || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, plotId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Activity Type</label>
                  <select
                    value={editingActivity?.activityType || 'Watering'}
                    onChange={(e) => setEditingActivity({ ...editingActivity, activityType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Watering">Watering</option>
                    <option value="Fertilizing">Fertilizing</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Spraying">Spraying</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Land Preparation">Land Preparation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={editingActivity?.scheduledDate || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={editingActivity?.priority || 'Medium'}
                    onChange={(e) => setEditingActivity({ ...editingActivity, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={editingActivity?.notes || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="Task instructions..."
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: FERTILIZER */}
      {showFertilizerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleFertilizerSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">Log Fertilizer Application</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Fertilizer Name / Formulation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NPK 15-15-15 or Urea"
                  value={editingFertilizer?.fertilizerName || ''}
                  onChange={(e) => setEditingFertilizer({ ...editingFertilizer, fertilizerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Plot *</label>
                  <select
                    required
                    value={editingFertilizer?.plotId || ''}
                    onChange={(e) => setEditingFertilizer({ ...editingFertilizer, plotId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Application Date</label>
                  <input
                    type="date"
                    value={editingFertilizer?.applicationDate || ''}
                    onChange={(e) => setEditingFertilizer({ ...editingFertilizer, applicationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={editingFertilizer?.quantity || 50}
                    onChange={(e) => setEditingFertilizer({ ...editingFertilizer, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                  <select
                    value={editingFertilizer?.unit || 'kg'}
                    onChange={(e) => setEditingFertilizer({ ...editingFertilizer, unit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Application Method</label>
                  <select
                    value={editingFertilizer?.applicationMethod || 'Broadcasting'}
                    onChange={(e) => setEditingFertilizer({ ...editingFertilizer, applicationMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Broadcasting">Broadcasting</option>
                    <option value="Drip fertigation">Drip fertigation</option>
                    <option value="Foliar spray">Foliar spray</option>
                    <option value="Band placement">Band placement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    value={editingFertilizer?.cost || 0}
                    onChange={(e) => setEditingFertilizer({ ...editingFertilizer, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFertilizerModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Fertilizer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: HARVEST */}
      {showHarvestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleHarvestSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">Record Harvest Yield</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Crop *</label>
                  <select
                    required
                    value={editingHarvest?.cropId || ''}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, cropId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Plot *</label>
                  <select
                    required
                    value={editingHarvest?.plotId || ''}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, plotId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harvest Date</label>
                  <input
                    type="date"
                    value={editingHarvest?.harvestDate || ''}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, harvestDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Quality Grade</label>
                  <select
                    value={editingHarvest?.qualityGrade || 'Grade A'}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, qualityGrade: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Processing)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={editingHarvest?.quantity || 100}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                  <select
                    value={editingHarvest?.unit || 'kg'}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, unit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="kg">kg</option>
                    <option value="bags">bags</option>
                    <option value="crates">crates</option>
                    <option value="metric tons">metric tons</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Est. Market Value ($)</label>
                <input
                  type="number"
                  value={editingHarvest?.marketEstimatedValue || 0}
                  onChange={(e) => setEditingHarvest({ ...editingHarvest, marketEstimatedValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHarvestModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Harvest
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SALE (ENCRYPTED) */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-stone-900">Add Sale (Encrypted locally)</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Crop Sold *</label>
                  <input
                    type="text"
                    required
                    value={editingSale?.cropName || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, cropName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="e.g. Maize"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Buyer / Market *</label>
                  <input
                    type="text"
                    required
                    value={editingSale?.buyerName || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, buyerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="e.g. Central Market"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={editingSale?.quantity || 1}
                    onChange={(e) => setEditingSale({ ...editingSale, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editingSale?.unit || 'kg'}
                    onChange={(e) => setEditingSale({ ...editingSale, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale?.unitPrice || 1.5}
                    onChange={(e) => setEditingSale({ ...editingSale, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Sale Date</label>
                  <input
                    type="date"
                    value={editingSale?.saleDate || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, saleDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={editingSale?.paymentStatus || 'Received'}
                    onChange={(e) => setEditingSale({ ...editingSale, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Encrypt & Save Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EXPENSE (ENCRYPTED) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleExpenseSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-stone-900">Record Farm Expense (AES-256)</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 bags of hybrid seeds"
                  value={editingExpense?.description || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Expense Category</label>
                  <select
                    value={editingExpense?.category || 'Fertilizer'}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Seeds/Seedlings">Seeds/Seedlings</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Labor">Labor</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Irrigation/Fuel">Irrigation/Fuel</option>
                    <option value="Pesticides/Chemicals">Pesticides/Chemicals</option>
                    <option value="Equipment/Tools">Equipment/Tools</option>
                    <option value="Land Lease/Other">Land Lease/Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingExpense?.amount || 0}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingExpense?.expenseDate || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Vendor / Supplier</label>
                  <input
                    type="text"
                    value={editingExpense?.vendor || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, vendor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="e.g. AgriSupply Co"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Encrypt & Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PEST */}
      {showPestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handlePestSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">Report Pest or Disease Incident</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Affected Crop *</label>
                  <select
                    required
                    value={editingPest?.cropId || ''}
                    onChange={(e) => setEditingPest({ ...editingPest, cropId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Plot *</label>
                  <select
                    required
                    value={editingPest?.plotId || ''}
                    onChange={(e) => setEditingPest({ ...editingPest, plotId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pest / Disease Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomato Blight or Aphids"
                    value={editingPest?.name || ''}
                    onChange={(e) => setEditingPest({ ...editingPest, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Severity</label>
                  <select
                    value={editingPest?.severity || 'Moderate'}
                    onChange={(e) => setEditingPest({ ...editingPest, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Symptoms Observed</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Yellowing concentric spots on lower leaves, curled tips"
                  value={editingPest?.symptoms || ''}
                  onChange={(e) => setEditingPest({ ...editingPest, symptoms: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Treatment Applied</label>
                <input
                  type="text"
                  placeholder="e.g. Copper fungicide spray, neem oil"
                  value={editingPest?.treatmentApplied || ''}
                  onChange={(e) => setEditingPest({ ...editingPest, treatmentApplied: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPestModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
