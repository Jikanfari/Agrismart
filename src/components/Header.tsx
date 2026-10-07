import React, { useState } from 'react';
import {
  Sprout, Wifi, WifiOff, ShieldCheck, Volume2, VolumeX,
  Sliders, UserCheck, ShieldAlert, QrCode, Lock, KeyRound, UserPlus
} from 'lucide-react';
import { useAccessibility } from '../hooks/useAccessibility';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  availableUsers: User[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onOpenEncryptionModal: () => void;
  onOpenAccessibilityModal: () => void;
  onOpenQRScanner?: () => void;
  onOpenAuthModal?: () => void;
  onOpenRegisterModal?: () => void;
  onLockNow?: () => void;
  hasPin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  availableUsers,
  isOnline,
  isSimulatedOffline,
  onOpenEncryptionModal,
  onOpenAccessibilityModal,
  onOpenQRScanner,
  onOpenAuthModal,
  onOpenRegisterModal,
  onLockNow,
  hasPin,
}) => {
  const { isSpeaking, stopSpeaking } = useAccessibility();
  const { isInstallable, isIOS, install } = usePWAInstall();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate">
                AgriSmart
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 hidden xs:inline-block">
                Mobile
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate hidden sm:block">
              Smart Agriculture Monitoring System
            </p>
          </div>
        </div>

        {/* Action badges and controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Audio Stop Button (if active speech) */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              title="Stop Voice Narration"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium animate-pulse transition-transform hover:scale-105"
            >
              <VolumeX className="w-4 h-4" />
              <span className="hidden xs:inline">Stop Audio</span>
            </button>
          )}

          {/* Network status pill */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title={isOnline ? 'Network Connected (Auto-Sync Active)' : 'Offline Mode (Local Encrypted Storage)'}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : isSimulatedOffline ? 'Simulated Offline' : 'Offline'}
            </span>
          </div>

          {/* AES-256 Encryption Status badge */}
          <button
            onClick={onOpenEncryptionModal}
            title="Encrypted Local Vault: AES-GCM 256-bit"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">AES-256</span>
          </button>

          {/* QR Code Scanner Button */}
          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              title="Scan Seed Packet or Fertilizer Bag QR Code"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
              aria-label="Scan QR code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          )}

          {/* Register Farmer & Site Button */}
          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              title="Register New Farmer Profile, Farm Location, Plots & Crops"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition"
              aria-label="Register Farmer"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Register Site</span>
            </button>
          )}

          {/* Quick Lock Button (if PIN configured) */}
          {hasPin && onLockNow && (
            <button
              onClick={onLockNow}
              title="Lock Field Vault Now"
              className="p-2 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 border border-amber-200 transition-colors"
              aria-label="Lock field vault"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Authentication & PIN Setup */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              title="Authentication, PIN & Role Permissions"
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Security and PIN settings"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          )}

          {/* Accessibility Settings */}
          <button
            onClick={onOpenAccessibilityModal}
            title="Accessibility: Text Size, High Contrast, Voice"
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            aria-label="Accessibility settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* PWA Install Button (if applicable) */}
          {isInstallable && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shadow-xs transition"
            >
              Install App
            </button>
          )}
          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 text-xs text-stone-700 hover:bg-stone-50"
            >
              iOS Install
            </button>
          )}

          {/* User profile & role switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
              aria-label="User profile switcher"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-semibold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden xs:block">
                <p className="text-xs font-medium text-stone-900 leading-none">
                  {currentUser.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-stone-500 capitalize leading-tight">
                  {currentUser.role}
                </p>
              </div>
            </button>

            {/* Dropdown */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-stone-100">
                  <p className="text-xs font-semibold text-stone-900">{currentUser.name}</p>
                  <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-stone-100 text-stone-700">
                    Role: {currentUser.role}
                  </span>
                </div>
                <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onSwitchUser(u)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      u.id === currentUser.id ? 'font-semibold text-emerald-800 bg-emerald-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div>
                      <p>{u.name}</p>
                      <span className="text-[10px] text-stone-400 capitalize">{u.role}</span>
                    </div>
                    {u.id === currentUser.id && (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
                {onOpenRegisterModal && (
                  <div className="pt-1.5 mt-1 border-t border-stone-100 px-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenRegisterModal();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Register New Farmer / Site</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* iOS Install instructions modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900 mb-2">Install AgriSmart on iPhone / iPad</h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              1. Tap the <strong className="text-stone-900">Share button</strong> (square with arrow) in Safari toolbar.<br />
              2. Scroll down and tap <strong className="text-stone-900">"Add to Home Screen"</strong>.<br />
              3. AgriSmart will install as an offline-capable mobile application.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
