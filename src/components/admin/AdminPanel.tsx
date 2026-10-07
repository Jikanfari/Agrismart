import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Plus, Database, RefreshCw, Key, Download,
  CheckCircle2, AlertTriangle, Clock, Layers, Lock, Cpu
} from 'lucide-react';
import { User, Role, SyncAuditLog } from '../../types';
import { storage } from '../../services/storage';
import { syncEngine } from '../../services/syncEngine';

interface AdminPanelProps {
  users: User[];
  onSaveUser: (user: User) => void;
  onOpenEncryptionModal: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  onSaveUser,
  onOpenEncryptionModal,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'sync' | 'system'>('users');
  const [syncLogs, setSyncLogs] = useState<SyncAuditLog[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    setSyncLogs(storage.getSyncLogs());
  }, []);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name || !editingUser?.email) return;

    const u: User = {
      id: editingUser.id || `user-${Date.now()}`,
      name: editingUser.name,
      email: editingUser.email,
      role: (editingUser.role as Role) || 'farmer',
      phone: editingUser.phone || '',
      farmIds: editingUser.farmIds || ['farm-1'],
      createdAt: editingUser.createdAt || new Date().toISOString(),
    };

    onSaveUser(u);
    setShowUserModal(false);
    setEditingUser(null);
  };

  const syncQueue = storage.getSyncQueue();
  const rawInspection = storage.getRawStorageInspection();

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              System Administration Panel
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Manage authorized users, inspect synchronization journals, and monitor cryptographic storage.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'users' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sync' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            Sync Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'system' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            System Info & Security
          </button>
        </div>
      </div>

      {/* 1. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Registered System Users & Role Assignments
            </h3>
            <button
              onClick={() => {
                setEditingUser({
                  name: '',
                  email: '',
                  role: 'farmer',
                  phone: '',
                  farmIds: ['farm-1'],
                });
                setShowUserModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900">{u.name}</h4>
                      <p className="text-[11px] text-stone-500">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                  <p>Contact Phone: <strong className="text-stone-800">{u.phone || 'None'}</strong></p>
                  <p>Assigned Farms: <span className="text-stone-800 font-mono text-[11px]">{u.farmIds.join(', ')}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SYNC AUDIT LOGS */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Current Pending Offline Sync Queue ({syncQueue.length} items)
              </h4>
              <button
                onClick={() => syncEngine.performSync()}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium"
              >
                Trigger Sync
              </button>
            </div>
            {syncQueue.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium py-1">
                ✓ Queue is completely synchronized. No pending offline items.
              </p>
            ) : (
              <div className="space-y-1 mt-2 text-xs font-mono max-h-40 overflow-y-auto">
                {syncQueue.map((item) => (
                  <div key={item.id} className="p-2 bg-stone-50 rounded-lg flex justify-between items-center text-[11px]">
                    <span>[{item.entityType.toUpperCase()}] {item.action}</span>
                    <span className="text-stone-400">{new Date(item.queuedAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
              Automated Synchronization History Log
            </h4>
            {syncLogs.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">No synchronization events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Status: {log.status.toUpperCase()} ({log.itemsSynced} items)
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SYSTEM INFO & SECURITY */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-700" /> System Architecture & Runtime Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">System Model</span>
                <p className="font-bold text-stone-900 mt-0.5">Smart Agriculture Monitoring System (SAMS)</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Academic Project Spec v1.0.0</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Local Storage Security</span>
                <p className="font-bold text-emerald-800 mt-0.5">AES-GCM (256-bit) + PBKDF2</p>
                <p className="text-[11px] text-stone-500 mt-0.5">100,000 Key Derivation Rounds</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Offline Capabilities</span>
                <p className="font-bold text-stone-900 mt-0.5">PWA Service Worker + Sync Queue</p>
                <p className="text-[11px] text-stone-500 mt-0.5">100% Offline-First execution</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Decision Engine</span>
                <p className="font-bold text-stone-900 mt-0.5">Predefined Rule-Based Evaluator</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Zero external API dependencies needed</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-950">Local Cryptographic Security Vault</p>
                <p className="text-[11px] text-emerald-900 mt-0.5">
                  Inspect AES-256 ciphertexts, change passphrases, and download encrypted backups.
                </p>
              </div>
              <button
                onClick={onOpenEncryptionModal}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Open Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleUserSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900 mb-3">Register System User</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={editingUser?.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@agrismart.org"
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">System Role</label>
                  <select
                    value={editingUser?.role || 'farmer'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 555-0192"
                    value={editingUser?.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-3 py-1.5 rounded-lg border text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Save User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
