import React from 'react';
import { X, Volume2, Type, Eye, Check } from 'lucide-react';
import { useAccessibility, TextSize } from '../hooks/useAccessibility';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    speakText,
    isSpeaking,
    stopSpeaking,
  } = useAccessibility();

  if (!isOpen) return null;

  const fontOptions: { id: TextSize; label: string; desc: string }[] = [
    { id: 'normal', label: 'Standard (16px)', desc: 'Default viewing size' },
    { id: 'large', label: 'Large (18px)', desc: 'Comfortable outdoor reading' },
    { id: 'xlarge', label: 'Extra Large (20px)', desc: 'High visibility in bright sunlight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Accessibility Preferences</h2>
              <p className="text-xs text-stone-500">Field readability & voice assistance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Font Size Scaling */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
              <Type className="w-4 h-4 text-emerald-700" />
              Display Font Size
            </label>
            <div className="grid grid-cols-1 gap-2">
              {fontOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTextSize(opt.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    textSize === opt.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium'
                      : 'border-stone-200 hover:border-stone-300 text-stone-800'
                  }`}
                >
                  <div>
                    <p className="text-sm">{opt.label}</p>
                    <p className="text-xs text-stone-500">{opt.desc}</p>
                  </div>
                  {textSize === opt.id && (
                    <Check className="w-4 h-4 text-emerald-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200">
            <div>
              <p className="text-sm font-medium text-stone-900">High Contrast Mode</p>
              <p className="text-xs text-stone-500">
                Enhance edge clarity for direct sun exposure
              </p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                highContrast ? 'bg-emerald-600' : 'bg-stone-300'
              }`}
              aria-label="Toggle high contrast"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Narration Testing */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span>Audio Speech Assistant</span>
              </div>
              <span className="text-[10px] text-stone-500">Web Speech API</span>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Listen to alerts and recommendations directly without looking at the screen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  speakText(
                    'Welcome to AgriSmart. Soil moisture in Plot A is currently at thirty-two percent. Drip irrigation is recommended for maize crops.'
                  )
                }
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Voice Readout</span>
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
