import React, { useState } from 'react';
import {
  MapPin, Plus, Trash2, Edit3, Sprout, Layers, Droplet,
  ChevronRight, Calendar, ArrowUpRight, AlertCircle
} from 'lucide-react';
import { Farm, Plot, Crop, CropGrowthStage, CropHealthStatus } from '../../types';

interface FarmManagementProps {
  farms: Farm[];
  plots: Plot[];
  crops: Crop[];
  onSaveFarm: (farm: Farm) => void;
  onDeleteFarm: (farmId: string) => void;
  onSavePlot: (plot: Plot) => void;
  onDeletePlot: (plotId: string) => void;
  onSaveCrop: (crop: Crop) => void;
  onDeleteCrop: (cropId: string) => void;
  onOpenRegisterModal?: () => void;
}

export const FarmManagement: React.FC<FarmManagementProps> = ({
  farms,
  plots,
  crops,
  onSaveFarm,
  onDeleteFarm,
  onSavePlot,
  onDeletePlot,
  onSaveCrop,
  onDeleteCrop,
  onOpenRegisterModal,
}) => {
  const [activeTab, setActiveTab] = useState<'plots' | 'crops'>('plots');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');

  // Modal states
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  // Form states
  const [editingFarm, setEditingFarm] = useState<Partial<Farm> | null>(null);
  const [editingPlot, setEditingPlot] = useState<Partial<Plot> | null>(null);
  const [editingCrop, setEditingCrop] = useState<Partial<Crop> | null>(null);

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const farmPlots = plots.filter((p) => p.farmId === currentFarm?.id);

  // Farm submission
  const handleFarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm?.name) return;

    const farm: Farm = {
      id: editingFarm.id || `farm-${Date.now()}`,
      name: editingFarm.name,
      location: editingFarm.location || '',
      totalArea: Number(editingFarm.totalArea) || 1,
      areaUnit: (editingFarm.areaUnit as any) || 'acres',
      notes: editingFarm.notes || '',
      createdAt: editingFarm.createdAt || new Date().toISOString(),
    };

    onSaveFarm(farm);
    setSelectedFarmId(farm.id);
    setShowFarmModal(false);
    setEditingFarm(null);
  };

  // Plot submission
  const handlePlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlot?.name || !currentFarm) return;

    const plot: Plot = {
      id: editingPlot.id || `plot-${Date.now()}`,
      farmId: currentFarm.id,
      name: editingPlot.name,
      size: Number(editingPlot.size) || 1,
      soilType: (editingPlot.soilType as any) || 'Loam',
      irrigationType: (editingPlot.irrigationType as any) || 'Drip',
      notes: editingPlot.notes || '',
      createdAt: editingPlot.createdAt || new Date().toISOString(),
    };

    onSavePlot(plot);
    setShowPlotModal(false);
    setEditingPlot(null);
  };

  // Crop submission
  const handleCropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrop?.name || !editingCrop?.plotId) return;

    const crop: Crop = {
      id: editingCrop.id || `crop-${Date.now()}`,
      plotId: editingCrop.plotId,
      name: editingCrop.name,
      variety: editingCrop.variety || '',
      plantingDate: editingCrop.plantingDate || new Date().toISOString().slice(0, 10),
      expectedHarvestDate: editingCrop.expectedHarvestDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      growthStage: (editingCrop.growthStage as CropGrowthStage) || 'Vegetative',
      healthStatus: (editingCrop.healthStatus as CropHealthStatus) || 'Healthy',
      targetMoistureMin: Number(editingCrop.targetMoistureMin) || 35,
      targetMoistureMax: Number(editingCrop.targetMoistureMax) || 75,
      targetTempMin: Number(editingCrop.targetTempMin) || 18,
      targetTempMax: Number(editingCrop.targetTempMax) || 32,
      notes: editingCrop.notes || '',
      createdAt: editingCrop.createdAt || new Date().toISOString(),
    };

    onSaveCrop(crop);
    setShowCropModal(false);
    setEditingCrop(null);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Bar: Farm Selector & Tabs */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Farm & Crop Management
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Register farm boundaries, plot soil types, and crop growth cycles.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setActiveTab('plots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'plots'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Plots & Fields ({plots.length})
          </button>
          <button
            onClick={() => setActiveTab('crops')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'crops'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Registered Crops ({crops.length})
          </button>
        </div>
      </div>

      {/* Selected Farm Information Card */}
      <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={currentFarm?.id}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="font-bold text-base text-stone-900 bg-transparent border-b border-emerald-600 focus:outline-hidden pr-4 cursor-pointer"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditingFarm(currentFarm);
                    setShowFarmModal(true);
                  }}
                  className="p-1 text-stone-500 hover:text-emerald-700"
                  title="Edit farm details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {currentFarm?.location} · {currentFarm?.totalArea} {currentFarm?.areaUnit}
              </p>
              {currentFarm?.notes && (
                <p className="text-xs text-stone-500 mt-1 italic">
                  "{currentFarm.notes}"
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Farmer & Site</span>
              </button>
            )}
            <button
              onClick={() => {
                setEditingFarm({
                  name: '',
                  location: '',
                  totalArea: 10,
                  areaUnit: 'acres',
                  notes: '',
                });
                setShowFarmModal(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-800 bg-white hover:bg-emerald-50 text-xs font-semibold"
            >
              + Quick Farm
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: PLOTS TAB */}
      {activeTab === 'plots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Plots in {currentFarm?.name} ({farmPlots.length})
            </h3>
            <button
              onClick={() => {
                setEditingPlot({
                  farmId: currentFarm?.id,
                  name: '',
                  size: 2.5,
                  soilType: 'Loam',
                  irrigationType: 'Drip',
                  notes: '',
                });
                setShowPlotModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Plot
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {farmPlots.map((plot) => {
              const plotCropList = crops.filter((c) => c.plotId === plot.id);
              return (
                <div
                  key={plot.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 hover:border-stone-300 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">
                        {plot.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Size: {plot.size} acres · Soil: <strong className="text-stone-700">{plot.soilType}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPlot(plot);
                          setShowPlotModal(true);
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                        title="Edit plot"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete plot "${plot.name}"?`)) {
                            onDeletePlot(plot.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete plot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                      Irrigation: {plot.irrigationType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                      {plotCropList.length} Crop{plotCropList.length !== 1 ? 's' : ''} Cultivated
                    </span>
                  </div>

                  {plot.notes && (
                    <p className="mt-2.5 text-xs text-stone-600 bg-stone-50 p-2 rounded-lg">
                      {plot.notes}
                    </p>
                  )}

                  {/* Associated Crops */}
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                      Cultivated Crops:
                    </p>
                    {plotCropList.length === 0 ? (
                      <p className="text-xs text-stone-400 italic">No crops assigned to this plot.</p>
                    ) : (
                      <div className="space-y-1">
                        {plotCropList.map((c) => (
                          <div
                            key={c.id}
                            className="text-xs flex items-center justify-between text-stone-800"
                          >
                            <span>🌱 {c.name} ({c.variety})</span>
                            <span className="text-[11px] text-emerald-700 font-medium">{c.growthStage}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CROPS TAB */}
      {activeTab === 'crops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Registered Crop Directory ({crops.length})
            </h3>
            <button
              onClick={() => {
                setEditingCrop({
                  plotId: plots[0]?.id || '',
                  name: '',
                  variety: '',
                  plantingDate: new Date().toISOString().slice(0, 10),
                  expectedHarvestDate: new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10),
                  growthStage: 'Vegetative',
                  healthStatus: 'Healthy',
                  targetMoistureMin: 35,
                  targetMoistureMax: 70,
                  targetTempMin: 18,
                  targetTempMax: 32,
                  notes: '',
                });
                setShowCropModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Register Crop
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {crops.map((crop) => {
              const assignedPlot = plots.find((p) => p.id === crop.plotId);
              const daysLeft = Math.ceil(
                (new Date(crop.expectedHarvestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={crop.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 hover:border-stone-300 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900">
                          {crop.name}
                        </h4>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            crop.healthStatus === 'Healthy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {crop.healthStatus}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Variety: {crop.variety} · Plot: {assignedPlot?.name || 'Unassigned'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCrop(crop);
                          setShowCropModal(true);
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                        title="Edit crop"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete crop "${crop.name}"?`)) {
                            onDeleteCrop(crop.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete crop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Growth stage & Harvest countdown */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Growth Stage</span>
                      <strong className="text-emerald-800">{crop.growthStage}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50">
                      <span className="text-[10px] text-stone-500 block">Expected Harvest</span>
                      <strong className={daysLeft <= 7 ? 'text-amber-700' : 'text-stone-800'}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Harvest Window Active!'}
                      </strong>
                    </div>
                  </div>

                  {/* Optimal moisture & temp parameters */}
                  <div className="mt-3 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100 pt-2">
                    <span>Target Moisture: {crop.targetMoistureMin}% - {crop.targetMoistureMax}%</span>
                    <span>Target Temp: {crop.targetTempMin}°C - {crop.targetTempMax}°C</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: FARM */}
      {showFarmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleFarmSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">
              {editingFarm?.id ? 'Edit Farm' : 'Register New Farm'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Farm Name *</label>
                <input
                  type="text"
                  required
                  value={editingFarm?.name || ''}
                  onChange={(e) => setEditingFarm({ ...editingFarm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="e.g. Sunny Acre Farms"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Location / District</label>
                <input
                  type="text"
                  value={editingFarm?.location || ''}
                  onChange={(e) => setEditingFarm({ ...editingFarm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="e.g. Sector 4, North Valley"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Total Area</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingFarm?.totalArea || 10}
                    onChange={(e) => setEditingFarm({ ...editingFarm, totalArea: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                  <select
                    value={editingFarm?.areaUnit || 'acres'}
                    onChange={(e) => setEditingFarm({ ...editingFarm, areaUnit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editingFarm?.notes || ''}
                  onChange={(e) => setEditingFarm({ ...editingFarm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="Farm notes..."
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFarmModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Farm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PLOT */}
      {showPlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handlePlotSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">
              {editingPlot?.id ? 'Edit Plot' : 'Add Plot to ' + currentFarm?.name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Plot Name / Sector *</label>
                <input
                  type="text"
                  required
                  value={editingPlot?.name || ''}
                  onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="e.g. Plot B - South Terraces"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPlot?.size || 2.5}
                    onChange={(e) => setEditingPlot({ ...editingPlot, size: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Soil Type</label>
                  <select
                    value={editingPlot?.soilType || 'Loam'}
                    onChange={(e) => setEditingPlot({ ...editingPlot, soilType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Loam">Loam</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Silt">Silt</option>
                    <option value="Clay-Loam">Clay-Loam</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Irrigation System</label>
                <select
                  value={editingPlot?.irrigationType || 'Drip'}
                  onChange={(e) => setEditingPlot({ ...editingPlot, irrigationType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                >
                  <option value="Drip">Drip</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Furrow">Furrow</option>
                  <option value="Manual / Rainfed">Manual / Rainfed</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingPlot?.notes || ''}
                  onChange={(e) => setEditingPlot({ ...editingPlot, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  placeholder="Drainage features, topography notes..."
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPlotModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Plot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CROP */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleCropSubmit}
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">
              {editingCrop?.id ? 'Edit Crop Registration' : 'Register New Crop'}
            </h3>
            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Assigned Plot *</label>
                <select
                  required
                  value={editingCrop?.plotId || ''}
                  onChange={(e) => setEditingCrop({ ...editingCrop, plotId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                >
                  <option value="">Select plot...</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.soilType})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCrop?.name || ''}
                    onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="e.g. Maize, Tomato"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Variety / Cultivar</label>
                  <input
                    type="text"
                    value={editingCrop?.variety || ''}
                    onChange={(e) => setEditingCrop({ ...editingCrop, variety: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    placeholder="e.g. Pioneer 30Y87"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Planting Date</label>
                  <input
                    type="date"
                    value={editingCrop?.plantingDate || ''}
                    onChange={(e) => setEditingCrop({ ...editingCrop, plantingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    value={editingCrop?.expectedHarvestDate || ''}
                    onChange={(e) => setEditingCrop({ ...editingCrop, expectedHarvestDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Growth Stage</label>
                  <select
                    value={editingCrop?.growthStage || 'Vegetative'}
                    onChange={(e) => setEditingCrop({ ...editingCrop, growthStage: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Maturation">Maturation</option>
                    <option value="Harvest Ready">Harvest Ready</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Health Status</label>
                  <select
                    value={editingCrop?.healthStatus || 'Healthy'}
                    onChange={(e) => setEditingCrop({ ...editingCrop, healthStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Good">Good</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Stressed">Stressed</option>
                    <option value="Infested">Infested</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Moisture Min (%)</label>
                  <input
                    type="number"
                    value={editingCrop?.targetMoistureMin ?? 35}
                    onChange={(e) => setEditingCrop({ ...editingCrop, targetMoistureMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Moisture Max (%)</label>
                  <input
                    type="number"
                    value={editingCrop?.targetMoistureMax ?? 75}
                    onChange={(e) => setEditingCrop({ ...editingCrop, targetMoistureMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Crop
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
