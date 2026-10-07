import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { SyncStatus } from '../services/syncEngine';

interface OfflineSyncBannerProps {
  syncStatus: SyncStatus;
  onToggleSimulatedOffline: (offline: boolean) => void;
  onTriggerSync: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  syncStatus,
  onToggleSimulatedOffline,
  onTriggerSync,
}) => {
  const { isOnline, isSimulatedOffline, isSyncing, pendingCount, lastSyncTime } = syncStatus;

  const formattedLastSync = new Date(lastSyncTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`border-b transition-colors px-3 py-2 text-xs ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-300 text-amber-950'
          : pendingCount > 0
          ? 'bg-blue-50 border-blue-200 text-blue-950'
          : 'bg-emerald-50/70 border-emerald-200/60 text-emerald-950'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Status explanation */}
        <div className="flex items-center gap-2 min-w-0">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 font-medium text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Offline Mode active. All data stored locally with AES-256 encryption.
              </span>
            </div>
          ) : pendingCount > 0 ? (
            <div className="flex items-center gap-1.5 font-medium text-blue-900">
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Syncing data to cloud...' : `${pendingCount} offline changes pending sync.`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Online & synchronized (Last sync: {formattedLastSync})</span>
            </div>
          )}

          {pendingCount > 0 && !isSyncing && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-semibold">
              <Shield className="w-3 h-3" />
              {pendingCount} in queue
            </span>
          )}
        </div>

        {/* Controls: Network simulator & manual sync trigger */}
        <div className="flex items-center gap-2">
          {/* Simulate Offline Toggle */}
          <button
            onClick={() => onToggleSimulatedOffline(!isSimulatedOffline)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              isSimulatedOffline
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
            }`}
            title="Toggle simulated offline mode to test field offline data entry and automatic resync"
          >
            {isSimulatedOffline ? 'Resume Online Mode' : 'Test Offline Mode'}
          </button>

          {/* Manual Sync Trigger */}
          {isOnline && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-medium shadow-xs transition"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
