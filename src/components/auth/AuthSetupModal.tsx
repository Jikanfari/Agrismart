import React, { useState } from 'react';
import {
  X, Lock, KeyRound, Fingerprint, ShieldCheck, CheckCircle2,
  AlertTriangle, UserCheck, Shield, UserPlus
} from 'lucide-react';
import { authService, PRESET_USERS } from '../../services/authService';
import { User, AuthSession } from '../../types';

interface AuthSetupModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onUserChanged: (user: User) => void;
  onOpenRegisterModal?: () => void;
}

export const AuthSetupModal: React.FC<AuthSetupModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserChanged,
  onOpenRegisterModal,
}) => {
  const [session, setSession] = useState<AuthSession>(() => authService.getSession());
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setStatusMsg({ text: 'PIN must be exactly 4 numeric digits.', type: 'error' });
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMsg({ text: 'PIN confirmation does not match.', type: 'error' });
      return;
    }

    try {
      await authService.setQuickPin(newPin);
      setSession(authService.getSession());
      setStatusMsg({ text: '4-Digit Quick PIN saved and offline lock enabled!', type: 'success' });
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to save PIN', type: 'error' });
    }
  };

  const handleRemovePin = () => {
    authService.removeQuickPin();
    setSession(authService.getSession());
    setStatusMsg({ text: 'Quick PIN removed.', type: 'success' });
  };

  const handleToggleBiometrics = () => {
    const next = !session.biometricEnabled;
    authService.setBiometricEnabled(next);
    setSession(authService.getSession());
  };

  const handleSwitchAccount = (u: User) => {
    authService.loginUser(u);
    onUserChanged(u);
    setSession(authService.getSession());
    setStatusMsg({ text: `Switched active operator to ${u.name} (${u.role})`, type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Authentication & Field Security
              </h3>
              <p className="text-xs text-stone-500">
                JWT tokens, offline 4-digit PIN & biometric access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Active Operator Card */}
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">Active Session</span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Role: {currentUser.role}
            </span>
          </div>
          <p className="font-bold text-stone-900 mt-1">{currentUser.name}</p>
          <p className="text-xs text-stone-500">{currentUser.email}</p>
          <div className="mt-2 text-[11px] text-stone-600 font-mono">
            Assigned Farms: {currentUser.farmIds.join(', ')}
          </div>
        </div>

        {/* Offline Quick PIN Setup Form */}
        <form onSubmit={handleSavePin} className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              Offline 4-Digit Quick Access PIN
            </label>
            {session.hasPin && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PIN Active
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500">
            Locks the app in the field so unauthorized hands cannot alter crop records or view private finances.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="password"
              maxLength={4}
              placeholder="New 4-Digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="px-3 py-2 text-center text-sm font-mono tracking-widest rounded-xl border border-stone-300"
            />
            <input
              type="password"
              maxLength={4}
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="px-3 py-2 text-center text-sm font-mono tracking-widest rounded-xl border border-stone-300"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {session.hasPin ? 'Update PIN' : 'Enable 4-Digit PIN'}
            </button>
            {session.hasPin && (
              <button
                type="button"
                onClick={handleRemovePin}
                className="py-2 px-3 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium"
              >
                Disable
              </button>
            )}
          </div>
        </form>

        {/* Biometrics Toggle */}
        <div className="p-3 rounded-2xl border border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-emerald-700" />
            <div>
              <p className="text-xs font-bold text-stone-900">Biometric Unlock</p>
              <p className="text-[11px] text-stone-500">Use device fingerprint or face sensor</p>
            </div>
          </div>
          <button
            onClick={handleToggleBiometrics}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              session.biometricEnabled ? 'bg-emerald-600' : 'bg-stone-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                session.biometricEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Operator Switcher (Demonstrating Role-Based Access Control) */}
        <div className="pt-2 border-t border-stone-100">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Switch Operator Profile (Test RBAC Authorization):
          </p>
          <div className="space-y-1.5">
            {PRESET_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSwitchAccount(u)}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                  u.id === currentUser.id
                    ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div>
                  <p>{u.name}</p>
                  <p className="text-[10px] text-stone-400 capitalize">
                    Role: {u.role} · Assigned: {u.farmIds.join(', ')}
                  </p>
                </div>
                {u.id === currentUser.id && (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            ))}
          </div>

          {onOpenRegisterModal && (
            <button
              onClick={() => {
                onClose();
                onOpenRegisterModal();
              }}
              className="w-full mt-2 p-2.5 rounded-xl border border-dashed border-emerald-600/60 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>+ Register New Farmer Profile & Site</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
          {session.hasPin && (
            <button
              onClick={() => {
                authService.lockSession();
                onClose();
              }}
              className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> Lock App Now
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
