import React, { useState } from 'react';
import {
  X, UserPlus, MapPin, Sprout, Layers, Lock, ShieldCheck,
  CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Smartphone,
  Compass, AlertCircle, Sparkles, Plus, Trash2, Calendar
} from 'lucide-react';
import { Farm, Plot, Crop, User, CropGrowthStage, SensorReading } from '../../types';
import { storage } from '../../services/storage';
import { authService } from '../../services/authService';
import { syncEngine } from '../../services/syncEngine';

interface FarmerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (newUser: User, newFarm: Farm) => void;
}

interface PlotDraft {
  id: string;
  name: string;
  size: number;
  soilType: 'Loam' | 'Clay' | 'Sandy' | 'Silt' | 'Clay-Loam';
  irrigationType: 'Drip' | 'Sprinkler' | 'Furrow' | 'Manual / Rainfed';
  cropName: string;
  cropVariety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: CropGrowthStage;
  targetMoistureMin: number;
  targetMoistureMax: number;
  targetTempMin: number;
  targetTempMax: number;
  notes: string;
}

const COMMON_CROPS = [
  { name: 'Maize / Corn', variety: 'Hybrid SC719', maturityDays: 110, moistMin: 35, moistMax: 70, tempMin: 18, tempMax: 32 },
  { name: 'Tomato', variety: 'Roma VF', maturityDays: 85, moistMin: 45, moistMax: 75, tempMin: 20, tempMax: 30 },
  { name: 'Cassava', variety: 'TME 419 Early', maturityDays: 240, moistMin: 25, moistMax: 65, tempMin: 22, tempMax: 35 },
  { name: 'Rice', variety: 'FARO 44 (SIPI)', maturityDays: 120, moistMin: 55, moistMax: 85, tempMin: 22, tempMax: 34 },
  { name: 'Yam', variety: 'White Guinea Yam', maturityDays: 180, moistMin: 35, moistMax: 70, tempMin: 24, tempMax: 32 },
  { name: 'Soybeans', variety: 'TGx 1448-2E', maturityDays: 95, moistMin: 35, moistMax: 68, tempMin: 20, tempMax: 32 },
  { name: 'Bell Pepper', variety: 'California Wonder', maturityDays: 90, moistMin: 40, moistMax: 70, tempMin: 20, tempMax: 30 },
  { name: 'Vegetables', variety: 'Exotic Greens', maturityDays: 45, moistMin: 45, moistMax: 75, tempMin: 18, tempMax: 28 },
];

export const FarmerRegistrationModal: React.FC<FarmerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Farmer Personal Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'farmer' | 'agronomist'>('farmer');
  const [quickPin, setQuickPin] = useState('');

  // Step 2: Farm & Location
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [totalArea, setTotalArea] = useState<number>(10);
  const [areaUnit, setAreaUnit] = useState<'acres' | 'hectares'>('acres');
  const [farmNotes, setFarmNotes] = useState('');

  // Step 3 & 4: Plots & What is he farming
  const [plots, setPlots] = useState<PlotDraft[]>([
    {
      id: `draft-plot-1`,
      name: 'North Plot 1',
      size: 4.5,
      soilType: 'Loam',
      irrigationType: 'Drip',
      cropName: 'Maize / Corn',
      cropVariety: 'Hybrid SC719',
      plantingDate: new Date(Date.now() - 25 * 86400000).toISOString().slice(0, 10),
      expectedHarvestDate: new Date(Date.now() + 85 * 86400000).toISOString().slice(0, 10),
      growthStage: 'Vegetative',
      targetMoistureMin: 35,
      targetMoistureMax: 70,
      targetTempMin: 18,
      targetTempMax: 32,
      notes: 'Main staple crop plot equipped with drip lines.',
    },
  ]);

  if (!isOpen) return null;

  // GPS auto-detection handler
  const handleDetectGPS = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          const lat = pos.coords.latitude.toFixed(4);
          const lon = pos.coords.longitude.toFixed(4);
          const accuracy = Math.round(pos.coords.accuracy);
          const locString = `Lat: ${lat}°, Lon: ${lon}° (GPS ±${accuracy}m precision)`;
          setFarmLocation(locString);
        },
        () => {
          setGpsLoading(false);
          // Fallback realistic agro coordinates if permission denied or unavailable
          setFarmLocation('Lat: 7.3775° N, Lon: 3.9470° E (Agricultural Zone Site)');
        },
        { timeout: 6000 }
      );
    } else {
      setGpsLoading(false);
      setFarmLocation('Lat: 7.3775° N, Lon: 3.9470° E (Agricultural Zone Site)');
    }
  };

  const handleAddPlot = () => {
    const newIdx = plots.length + 1;
    setPlots((prev) => [
      ...prev,
      {
        id: `draft-plot-${Date.now()}-${newIdx}`,
        name: `Plot ${newIdx} (${farmName || 'Field'})`,
        size: 2.0,
        soilType: 'Loam',
        irrigationType: 'Manual / Rainfed',
        cropName: 'Tomato',
        cropVariety: 'Roma VF',
        plantingDate: new Date().toISOString().slice(0, 10),
        expectedHarvestDate: new Date(Date.now() + 85 * 86400000).toISOString().slice(0, 10),
        growthStage: 'Vegetative',
        targetMoistureMin: 45,
        targetMoistureMax: 75,
        targetTempMin: 20,
        targetTempMax: 30,
        notes: '',
      },
    ]);
  };

  const handleRemovePlot = (id: string) => {
    if (plots.length <= 1) return;
    setPlots((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePlotField = (id: string, field: keyof PlotDraft, value: any) => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };

        // If changing crop from common list, update recommendations
        if (field === 'cropName') {
          const match = COMMON_CROPS.find((c) => c.name === value);
          if (match) {
            updated.cropVariety = match.variety;
            updated.targetMoistureMin = match.moistMin;
            updated.targetMoistureMax = match.moistMax;
            updated.targetTempMin = match.tempMin;
            updated.targetTempMax = match.tempMax;
            const plantTime = new Date(updated.plantingDate || Date.now()).getTime();
            updated.expectedHarvestDate = new Date(plantTime + match.maturityDays * 86400000)
              .toISOString()
              .slice(0, 10);
          }
        }
        return updated;
      })
    );
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter the farmer’s full name.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please provide a valid contact email address.');
        return false;
      }
      if (quickPin && (quickPin.length !== 4 || !/^\d{4}$/.test(quickPin))) {
        setErrorMsg('If setting a Quick PIN, it must be exactly 4 numeric digits.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!farmName.trim()) {
        setErrorMsg('Please enter a Farm or Site Name.');
        return false;
      }
      if (!farmLocation.trim()) {
        setErrorMsg('Please enter or detect the farm location / coordinates.');
        return false;
      }
      if (totalArea <= 0) {
        setErrorMsg('Total farm area must be greater than 0.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (plots.length === 0) {
        setErrorMsg('Please configure at least one agricultural plot.');
        return false;
      }
      for (const p of plots) {
        if (!p.name.trim()) {
          setErrorMsg('Each plot must have a valid identifier or name.');
          return false;
        }
        if (p.size <= 0) {
          setErrorMsg(`Plot "${p.name}" size must be greater than 0.`);
          return false;
        }
      }
    }
    if (currentStep === 4) {
      for (const p of plots) {
        if (!p.cropName.trim()) {
          setErrorMsg(`Please specify what crop is being farmed in "${p.name}".`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => (s + 1) as any);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((s) => (s - 1) as any);
  };

  // Complete Registration & Sync to Site
  const handleFinalizeRegistration = async () => {
    setIsSubmitting(true);
    setSyncStatusText('Creating encrypted farmer credentials...');

    try {
      const timestamp = new Date().toISOString();
      const newFarmId = `farm-${Date.now()}`;
      const newUserId = `user-${Date.now()}`;

      // 1. Build Farm entity
      const newFarm: Farm = {
        id: newFarmId,
        name: farmName.trim(),
        location: farmLocation.trim(),
        totalArea: Number(totalArea),
        areaUnit,
        notes: farmNotes.trim() || `Registered on ${new Date().toLocaleDateString()} with ${plots.length} plots.`,
        createdAt: timestamp,
      };

      // 2. Build User entity
      const newUser: User = {
        id: newUserId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        phone: phone.trim() || undefined,
        farmIds: [newFarmId],
        createdAt: timestamp,
      };

      // 3. Save Farm to storage
      setSyncStatusText('Registering farm site coordinates and geometry...');
      storage.saveFarm(newFarm);

      // 4. Save User to encrypted storage & sync queue
      setSyncStatusText('Securing user record with AES-GCM 256-bit encryption...');
      await storage.saveUser(newUser);

      // 5. Build and save Plots & Crops
      setSyncStatusText('Establishing farm plots and crop cultivation matrices...');
      for (let i = 0; i < plots.length; i++) {
        const p = plots[i];
        const plotId = `plot-${Date.now()}-${i + 1}`;
        const newPlot: Plot = {
          id: plotId,
          farmId: newFarmId,
          name: p.name.trim(),
          size: Number(p.size),
          soilType: p.soilType,
          irrigationType: p.irrigationType,
          notes: p.notes.trim() || undefined,
          createdAt: timestamp,
        };
        storage.savePlot(newPlot);

        // Crop for this plot
        const cropId = `crop-${Date.now()}-${i + 1}`;
        const newCrop: Crop = {
          id: cropId,
          plotId: plotId,
          name: p.cropName.trim(),
          variety: p.cropVariety.trim() || 'Standard Variety',
          plantingDate: p.plantingDate,
          expectedHarvestDate: p.expectedHarvestDate,
          growthStage: p.growthStage,
          healthStatus: 'Healthy',
          targetMoistureMin: p.targetMoistureMin,
          targetMoistureMax: p.targetMoistureMax,
          targetTempMin: p.targetTempMin,
          targetTempMax: p.targetTempMax,
          notes: `Cultivated by ${newUser.name} at ${newFarm.name}.`,
          createdAt: timestamp,
        };
        storage.saveCrop(newCrop);

        // Initial baseline reading for immediate monitoring telemetry
        const baselineReading: SensorReading = {
          id: `reading-${Date.now()}-${i + 1}`,
          plotId: plotId,
          soilMoisture: Math.round((p.targetMoistureMin + p.targetMoistureMax) / 2),
          temperature: 26.5,
          humidity: 62,
          rainfall: 0,
          recordedAt: timestamp,
          source: 'manual',
          notes: 'Initial baseline setup reading for registered plot.',
          synced: false,
        };
        storage.addReading(baselineReading);
      }

      // 6. Set Quick PIN if provided
      if (quickPin && quickPin.length === 4) {
        await authService.setQuickPin(quickPin);
      }

      // 7. Log in the new user immediately
      setSyncStatusText('Authenticating session & issuing JWT authorization token...');
      authService.loginUser(newUser);
      storage.setCurrentUser(newUser);

      // 8. Trigger automatic sync if online
      if (storage.getEffectiveOnlineStatus()) {
        setSyncStatusText('Broadcasting records to central AgriSmart site via Auto-Sync...');
        await syncEngine.performSync();
      }

      setSyncStatusText('Site and registration completed successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        onRegistered(newUser, newFarm);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to complete registration and sync.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Farmer Registration & Site Setup
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  AgriSmart Site
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Register operator profile, farm coordinates, plots, and active crops
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Close registration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-stone-500">
            <span className={step === 1 ? 'text-emerald-700 font-bold' : ''}>1. Farmer Info</span>
            <span className={step === 2 ? 'text-emerald-700 font-bold' : ''}>2. Farm & Location</span>
            <span className={step === 3 ? 'text-emerald-700 font-bold' : ''}>3. Plots</span>
            <span className={step === 4 ? 'text-emerald-700 font-bold' : ''}>4. Farming Details</span>
            <span className={step === 5 ? 'text-emerald-700 font-bold' : ''}>5. Sync to Site</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step Content Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* STEP 1: Farmer Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Offline-First Secured Profile
                </span>
                Your personal and agricultural credentials are protected locally using AES-GCM 256-bit
                encryption and will automatically replicate to the AgriSmart server when network is restored.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Phone Number (Mobile SMS Alerts)
                    </label>
                    <input
                      type="tel"
                      placeholder="+234 803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Role / Responsibility
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="farmer">Farmer / Primary Cultivator</option>
                      <option value="agronomist">Field Agronomist / Advisor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                      <span>Offline 4-Digit Quick PIN</span>
                      <span className="text-[10px] text-stone-400 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="e.g. 1234"
                        value={quickPin}
                        onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Locks mobile access in the field so sensitive finances stay protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Farm & Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Farm / Site Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Agro Site"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Location with GPS Auto-detection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Farm Location & Coordinates <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={gpsLoading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-medium border border-emerald-200 transition"
                  >
                    <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'Detecting GPS...' : 'Use Current GPS'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lat: 7.3775° N, Lon: 3.9470° E (Ibadan Agro Belt)"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Enter geographic coordinates or address. Enables precise 7-day weather forecasting and evapotranspiration calculations.
                </p>
              </div>

              {/* Total Area and Units */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Total Farm Area <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={totalArea}
                    onChange={(e) => setTotalArea(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Site Description & Soil Characteristics
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fertile river valley soil, accessible via south gravel road with solar borehole irrigation."
                  value={farmNotes}
                  onChange={(e) => setFarmNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Plots Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Configure Farm Plots
                  </h4>
                  <p className="text-xs text-stone-500">
                    Define the parcel boundaries, soil textures, and irrigation infrastructure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPlot}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plot</span>
                </button>
              </div>

              <div className="space-y-3">
                {plots.map((plotDraft, index) => (
                  <div
                    key={plotDraft.id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={plotDraft.name}
                          onChange={(e) => updatePlotField(plotDraft.id, 'name', e.target.value)}
                          placeholder="Plot Name (e.g. North Plot 1)"
                          className="font-bold text-sm bg-transparent border-b border-stone-300 focus:border-emerald-600 focus:outline-none text-stone-900"
                        />
                      </div>
                      {plots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlot(plotDraft.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded"
                          title="Remove Plot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                          Size ({areaUnit})
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={plotDraft.size}
                          onChange={(e) => updatePlotField(plotDraft.id, 'size', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                          Soil Type
                        </label>
                        <select
                          value={plotDraft.soilType}
                          onChange={(e) => updatePlotField(plotDraft.id, 'soilType', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        >
                          <option value="Loam">Loam (Optimal drainage)</option>
                          <option value="Clay">Clay (High water retention)</option>
                          <option value="Sandy">Sandy (High aeration)</option>
                          <option value="Silt">Silt (Rich fine particles)</option>
                          <option value="Clay-Loam">Clay-Loam</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                          Irrigation Method
                        </label>
                        <select
                          value={plotDraft.irrigationType}
                          onChange={(e) => updatePlotField(plotDraft.id, 'irrigationType', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        >
                          <option value="Drip">Drip Irrigation</option>
                          <option value="Sprinkler">Sprinkler / Overhead</option>
                          <option value="Furrow">Furrow / Surface Basin</option>
                          <option value="Manual / Rainfed">Manual / Rainfed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: What is he farming? (Crops details) */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  What is the farmer cultivating?
                </h4>
                <p className="text-xs text-stone-500">
                  Select or enter the crop varieties planted in each plot to initialize health thresholds and harvest alarms.
                </p>
              </div>

              {/* Crop quick selector suggestions */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-2">
                  Popular Crops (Auto-sets moisture thresholds):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CROPS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        // Apply to the first plot
                        if (plots[0]) updatePlotField(plots[0].id, 'cropName', c.name);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs bg-white border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50 text-stone-700 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop form for each plot */}
              <div className="space-y-4">
                {plots.map((plotDraft, index) => (
                  <div
                    key={plotDraft.id}
                    className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                      <span className="text-xs font-bold text-emerald-900">
                        Plot {index + 1}: {plotDraft.name} ({plotDraft.size} {areaUnit})
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Soil: {plotDraft.soilType} · {plotDraft.irrigationType}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">
                          Crop Being Cultivated <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maize / Corn, Tomato"
                          value={plotDraft.cropName}
                          onChange={(e) => updatePlotField(plotDraft.id, 'cropName', e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">
                          Variety / Hybrid Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hybrid SC719, Roma VF"
                          value={plotDraft.cropVariety}
                          onChange={(e) => updatePlotField(plotDraft.id, 'cropVariety', e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                          Planting Date
                        </label>
                        <input
                          type="date"
                          value={plotDraft.plantingDate}
                          onChange={(e) => updatePlotField(plotDraft.id, 'plantingDate', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                          Expected Harvest Date
                        </label>
                        <input
                          type="date"
                          value={plotDraft.expectedHarvestDate}
                          onChange={(e) => updatePlotField(plotDraft.id, 'expectedHarvestDate', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                          Current Growth Stage
                        </label>
                        <select
                          value={plotDraft.growthStage}
                          onChange={(e) => updatePlotField(plotDraft.id, 'growthStage', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                        >
                          <option value="Germination">Germination</option>
                          <option value="Vegetative">Vegetative</option>
                          <option value="Flowering">Flowering</option>
                          <option value="Fruiting">Fruiting</option>
                          <option value="Maturation">Maturation</option>
                          <option value="Harvest Ready">Harvest Ready</option>
                        </select>
                      </div>
                    </div>

                    {/* Moisture thresholds */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-stone-700">
                      <div>
                        <label className="block text-[10px] text-stone-500">Min Moisture (%)</label>
                        <input
                          type="number"
                          min="10"
                          max="90"
                          value={plotDraft.targetMoistureMin}
                          onChange={(e) => updatePlotField(plotDraft.id, 'targetMoistureMin', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white rounded-md border border-stone-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500">Max Moisture (%)</label>
                        <input
                          type="number"
                          min="20"
                          max="95"
                          value={plotDraft.targetMoistureMax}
                          onChange={(e) => updatePlotField(plotDraft.id, 'targetMoistureMax', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white rounded-md border border-stone-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500">Min Temp (°C)</label>
                        <input
                          type="number"
                          value={plotDraft.targetTempMin}
                          onChange={(e) => updatePlotField(plotDraft.id, 'targetTempMin', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white rounded-md border border-stone-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500">Max Temp (°C)</label>
                        <input
                          type="number"
                          value={plotDraft.targetTempMax}
                          onChange={(e) => updatePlotField(plotDraft.id, 'targetTempMax', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white rounded-md border border-stone-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Instant Sync to Site */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-emerald-800 text-white p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                    Site Summary & Ready to Synchronize
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-100 border border-emerald-600">
                    AES-GCM Encrypted
                  </span>
                </div>
                <h3 className="text-lg font-bold">{farmName}</h3>
                <p className="text-xs text-emerald-100 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {farmLocation} · {totalArea} {areaUnit}
                </p>
              </div>

              {/* Farmer and plot review grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Operator Profile</span>
                  <p className="font-bold text-stone-900">{fullName}</p>
                  <p className="text-stone-600">{email}</p>
                  {phone && <p className="text-stone-500">{phone}</p>}
                  <p className="text-[11px] text-emerald-700 capitalize font-medium">Role: {role}</p>
                  {quickPin && (
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      4-Digit PIN Protected
                    </span>
                  )}
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Cultivation Layout</span>
                  <p className="font-bold text-stone-900">{plots.length} Configured Plot(s)</p>
                  <ul className="text-stone-600 space-y-1 text-[11px] mt-1">
                    {plots.map((p, idx) => (
                      <li key={p.id} className="flex items-center justify-between">
                        <span>
                          {idx + 1}. {p.name}: <strong className="text-stone-800">{p.cropName}</strong>
                        </span>
                        <span className="text-stone-400">({p.size} {areaUnit})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sync queue explanation */}
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-white text-xs space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold">
                  <RefreshCw className="w-4 h-4 text-emerald-700" />
                  <span>Site Synchronization Protocol</span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  When you submit, your account, farm site, plots, and crop matrices will be queued into the local sync queue and immediately posted to your AgriSmart site. If you are currently offline, all records remain safely encrypted on device and will automatically sync the moment connection returns.
                </p>
                <div className="flex items-center gap-2 pt-1 border-t border-stone-100 text-[11px]">
                  <span className="font-semibold text-stone-500">Current Network Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      storage.getEffectiveOnlineStatus()
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {storage.getEffectiveOnlineStatus() ? 'Online (Instant Cloud Sync)' : 'Offline (Local Safe Queue)'}
                  </span>
                </div>
              </div>

              {syncStatusText && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-emerald-700" />
                  <span>{syncStatusText}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleBack}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-700 text-xs font-medium"
            >
              Cancel
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalizeRegistration}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Site...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Registration & Sync</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
