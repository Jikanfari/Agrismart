import React, { useState } from 'react';
import {
  Lock, KeyRound, Fingerprint, Delete, CheckCircle2,
  AlertTriangle, ShieldCheck, UserCheck, RefreshCw
} from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types';

interface LockScreenModalProps {
  isLocked: boolean;
  currentUser: User;
  onUnlocked: () => void;
  onSwitchUser: (user: User) => void;
  availableUsers: User[];
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({
  isLocked,
  currentUser,
  onUnlocked,
  onSwitchUser,
  availableUsers,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);

  if (!isLocked) return null;

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg(null);

    // Auto verify upon 4 digits
    if (newPin.length === 4) {
      setIsVerifying(true);
      setTimeout(async () => {
        const success = await authService.verifyAndUnlock(newPin);
        setIsVerifying(false);
        if (success) {
          setPin('');
          onUnlocked();
        } else {
          setErrorMsg('Incorrect PIN. Please try again.');
          setPin('');
        }
      }, 250);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleBiometricUnlock = async () => {
    setIsVerifying(true);
    const success = await authService.unlockWithBiometrics();
    setIsVerifying(false);
    if (success) {
      onUnlocked();
    } else {
      setErrorMsg('Biometric authentication failed. Enter PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center flex flex-col items-center">
        {/* Shield Lock Header */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 shadow-inner">
          <Lock className="w-8 h-8 text-emerald-700" />
        </div>

        <h2 className="text-lg font-bold text-stone-900">
          AgriSmart Field Vault Locked
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Enter 4-digit PIN to decrypt local farm records
        </p>

        {/* User Badge */}
        <div className="mt-3 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span className="font-semibold text-stone-900">{currentUser.name}</span>
          <span className="text-[10px] uppercase font-bold text-stone-500">({currentUser.role})</span>
        </div>

        {/* PIN Indicators */}
        <div className="my-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? 'bg-emerald-600 border-emerald-600 scale-110 shadow-xs'
                  : 'border-stone-300 bg-stone-100'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-600 font-medium mb-3 flex items-center gap-1 justify-center animate-shake">
            <AlertTriangle className="w-3.5 h-3.5" /> {errorMsg}
          </p>
        )}

        {/* Tactile Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={isVerifying}
              className="h-14 rounded-2xl bg-stone-50 hover:bg-emerald-50 active:bg-emerald-100 border border-stone-200 text-lg font-bold text-stone-800 shadow-xs transition select-none flex items-center justify-center"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleBiometricUnlock}
            title="Biometric fingerprint / face unlock"
            className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-200 text-stone-700 flex items-center justify-center transition"
          >
            <Fingerprint className="w-6 h-6 text-emerald-700" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="h-14 rounded-2xl bg-stone-50 hover:bg-emerald-50 active:bg-emerald-100 border border-stone-200 text-lg font-bold text-stone-800 shadow-xs transition select-none flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            title="Backspace"
            className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-200 text-stone-700 flex items-center justify-center transition"
          >
            <Delete className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Footer controls */}
        <div className="w-full pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowSwitch(!showSwitch)}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Switch Account
          </button>

          <span className="text-[10px] text-stone-400 font-mono">
            AES-256 Offline Enclave
          </span>
        </div>

        {/* Account Switcher sub-drawer */}
        {showSwitch && (
          <div className="mt-3 w-full bg-stone-50 p-3 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
            <p className="font-bold text-stone-700 text-[11px] uppercase tracking-wider">
              Select Operator Profile:
            </p>
            {availableUsers.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  onSwitchUser(u);
                  setShowSwitch(false);
                }}
                className="w-full p-2 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 text-left flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-stone-900">{u.name}</p>
                  <p className="text-[10px] text-stone-500 capitalize">{u.role}</p>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
