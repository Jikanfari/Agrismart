import React, { useState, useEffect, useRef } from 'react';
import {
  X, Camera, Flashlight, FlipHorizontal, Upload, CheckCircle2,
  AlertTriangle, Sprout, Layers, DollarSign, Sparkles, RefreshCw,
  QrCode
} from 'lucide-react';
import jsQR from 'jsqr';
import {
  parseAgriculturalQR, ScannedProductResult, SAMPLE_AGRICULTURAL_QR_PRESETS,
  ScannedSeedPayload, ScannedFertilizerPayload, ScannedExpensePayload
} from '../../services/qrParser';
import { Plot, Crop, FertilizerRecord, ExpenseRecord } from '../../types';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  plots: Plot[];
  onClose: () => void;
  onSaveCrop: (crop: Crop) => void;
  onSaveFertilizer: (fertilizer: FertilizerRecord) => void;
  onSaveExpense: (expense: ExpenseRecord) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  plots,
  onClose,
  onSaveCrop,
  onSaveFertilizer,
  onSaveExpense,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedProductResult | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || '');
  const [recordExpenseToo, setRecordExpenseToo] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setSuccessToast(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }

      // Check torch support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can select sample QR presets below or upload an image.'
          : 'Unable to access camera. Please use sample presets or upload a photo.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.warn('Torch failed:', err);
    }
  };

  // Continuous frame scanning loop
  useEffect(() => {
    let animationFrameId: number;

    const scanFrame = () => {
      if (
        isOpen &&
        !scannedResult &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleCodeDecoded(code.data);
            return;
          }
        }
      }

      if (isOpen && !scannedResult) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    if (stream && !scannedResult) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, stream, scannedResult]);

  const handleCodeDecoded = (rawString: string) => {
    const parsed = parseAgriculturalQR(rawString);
    setScannedResult(parsed);
    // Beep audio feedback (optional Web Audio synth)
    playScanBeep();
  };

  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Ignore audio error
    }
  };

  // Image file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code) {
            handleCodeDecoded(code.data);
          } else {
            alert('No valid QR code detected in the selected image. Please try another photo or use presets.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Confirm and populate to database
  const handlePopulateDatabase = () => {
    if (!scannedResult) return;
    const targetPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
    const nowStr = new Date().toISOString();

    if (scannedResult.productType === 'seed' && scannedResult.seedData) {
      const seed = scannedResult.seedData;
      const expectedHarvest = new Date(
        Date.now() + (seed.daysToMaturity || 90) * 24 * 60 * 60 * 1000
      ).toISOString().slice(0, 10);

      // Save crop
      const newCrop: Crop = {
        id: `crop-qr-${Date.now()}`,
        plotId: targetPlot.id,
        name: seed.cropName,
        variety: seed.variety,
        plantingDate: nowStr.slice(0, 10),
        expectedHarvestDate: expectedHarvest,
        growthStage: 'Germination',
        healthStatus: 'Healthy',
        targetMoistureMin: seed.targetMoistureMin || 35,
        targetMoistureMax: seed.targetMoistureMax || 75,
        targetTempMin: seed.targetTempMin || 18,
        targetTempMax: seed.targetTempMax || 32,
        notes: `QR Scanned from seed packet. Lot: ${seed.batchNumber || 'N/A'}. ${seed.notes || ''}`,
        createdAt: nowStr,
      };

      onSaveCrop(newCrop);

      // Optional expense
      if (recordExpenseToo && seed.cost && seed.cost > 0) {
        const exp: ExpenseRecord = {
          id: `exp-seed-${Date.now()}`,
          plotId: targetPlot.id,
          category: 'Seeds/Seedlings',
          expenseDate: nowStr.slice(0, 10),
          amount: seed.cost,
          description: `Seed purchase: ${seed.cropName} (${seed.variety})`,
          vendor: seed.vendor || 'Seed Supply',
          receiptNumber: seed.batchNumber || `QR-${Date.now()}`,
          notes: 'Auto-populated via seed packet QR scan.',
          createdAt: nowStr,
        };
        onSaveExpense(exp);
      }

      setSuccessToast(`Successfully registered ${seed.cropName} into ${targetPlot.name}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (scannedResult.productType === 'fertilizer' && scannedResult.fertilizerData) {
      const fert = scannedResult.fertilizerData;

      const newFertilizer: FertilizerRecord = {
        id: `fert-qr-${Date.now()}`,
        plotId: targetPlot.id,
        fertilizerName: fert.fertilizerName,
        applicationDate: nowStr.slice(0, 10),
        quantity: fert.quantity || 50,
        unit: fert.unit || 'kg',
        applicationMethod: fert.applicationMethod || 'Broadcasting',
        cost: fert.cost || 0,
        notes: `QR Scanned from bag. ${fert.formulation || ''}. ${fert.safetyNotes || ''}`,
        createdAt: nowStr,
      };

      onSaveFertilizer(newFertilizer);

      // Optional expense
      if (recordExpenseToo && fert.cost && fert.cost > 0) {
        const exp: ExpenseRecord = {
          id: `exp-fert-${Date.now()}`,
          plotId: targetPlot.id,
          category: 'Fertilizer',
          expenseDate: nowStr.slice(0, 10),
          amount: fert.cost,
          description: `Fertilizer purchase: ${fert.fertilizerName}`,
          vendor: fert.vendor || 'AgriChem Supplier',
          notes: 'Auto-populated via fertilizer bag QR scan.',
          createdAt: nowStr,
        };
        onSaveExpense(exp);
      }

      setSuccessToast(`Successfully logged ${fert.fertilizerName} for ${targetPlot.name}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (scannedResult.productType === 'expense' && scannedResult.expenseData) {
      const expData = scannedResult.expenseData;

      const exp: ExpenseRecord = {
        id: `exp-qr-${Date.now()}`,
        plotId: targetPlot.id,
        category: (expData.category as any) || 'Pesticides/Chemicals',
        expenseDate: nowStr.slice(0, 10),
        amount: expData.amount,
        description: expData.description,
        vendor: expData.vendor || 'Supplier',
        notes: expData.notes || 'Logged via QR scanner',
        createdAt: nowStr,
      };

      onSaveExpense(exp);
      setSuccessToast(`Successfully recorded expense: ${expData.description}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setSuccessToast('QR code details recorded.');
      setTimeout(() => onClose(), 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Scan Seed Packet / Fertilizer Bag
              </h3>
              <p className="text-xs text-stone-500">
                Camera QR scanner for instant agricultural record population
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Step 1: Scanning View */}
        {!scannedResult ? (
          <div className="mt-4 space-y-4">
            {/* Viewfinder Window */}
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/80 rounded-2xl relative">
                  {/* Corner brackets */}
                  <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Pulsing laser scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>

              {/* Camera Error banner */}
              {cameraError && (
                <div className="absolute inset-x-3 bottom-3 p-2.5 bg-black/80 backdrop-blur-xs text-stone-200 text-xs rounded-xl border border-stone-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Viewfinder Controls (Torch, Upload) */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl backdrop-blur-md transition ${
                      torchOn ? 'bg-amber-400 text-stone-950' : 'bg-black/60 text-white'
                    }`}
                    title="Toggle Flashlight / Torch"
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition"
                  title="Scan from photo in device gallery"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <p className="text-center text-xs text-stone-500">
              Align the QR code on the seed packet or fertilizer bag inside the frame.
            </p>

            {/* Quick Presets for Instant Testing (Agricultural Packets) */}
            <div className="pt-2 border-t border-stone-200">
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Quick-Test Agricultural QR Presets:
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {SAMPLE_AGRICULTURAL_QR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleCodeDecoded(preset.payload)}
                    className="w-full text-left p-2.5 rounded-xl border border-stone-200 hover:border-emerald-500 bg-stone-50/70 hover:bg-emerald-50/50 text-xs text-stone-800 transition flex items-center justify-between"
                  >
                    <span className="font-medium truncate">{preset.label}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                      Simulate Scan
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Scanned Result Confirmation & Auto-Population Form */
          <div className="mt-4 space-y-4">
            {/* Detected Product Summary Card */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    {scannedResult.productType === 'seed' ? (
                      <Sprout className="w-4 h-4" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      {scannedResult.productType.toUpperCase()} RECOGNIZED
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 mt-1">
                      {scannedResult.title}
                    </h4>
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                {scannedResult.summary}
              </p>
            </div>

            {/* Target Plot Destination */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Assign to Plot / Field Location *
              </label>
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.soilType} - {p.size} acres)
                  </option>
                ))}
              </select>
            </div>

            {/* Seed specific details */}
            {scannedResult.seedData && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Maturity Countdown:</span>
                  <strong className="text-stone-900">{scannedResult.seedData.daysToMaturity} days</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Target Moisture Range:</span>
                  <strong className="text-stone-900">
                    {scannedResult.seedData.targetMoistureMin}% - {scannedResult.seedData.targetMoistureMax}%
                  </strong>
                </div>
                {scannedResult.seedData.cost && (
                  <label className="flex items-center gap-2 pt-2 border-t border-stone-200 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordExpenseToo}
                      onChange={(e) => setRecordExpenseToo(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span>
                      Also log seed packet purchase expense (${scannedResult.seedData.cost})
                    </span>
                  </label>
                )}
              </div>
            )}

            {/* Fertilizer specific details */}
            {scannedResult.fertilizerData && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Dosage Application:</span>
                  <strong className="text-stone-900">
                    {scannedResult.fertilizerData.quantity} {scannedResult.fertilizerData.unit} via {scannedResult.fertilizerData.applicationMethod}
                  </strong>
                </div>
                {scannedResult.fertilizerData.cost && (
                  <label className="flex items-center gap-2 pt-2 border-t border-stone-200 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordExpenseToo}
                      onChange={(e) => setRecordExpenseToo(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span>
                      Also log fertilizer bag purchase expense (${scannedResult.fertilizerData.cost})
                    </span>
                  </label>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setScannedResult(null);
                  startCamera();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Scan Another
              </button>

              <button
                type="button"
                onClick={handlePopulateDatabase}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Populate Farm Database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
