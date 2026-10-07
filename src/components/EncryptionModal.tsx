import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, Lock, Key, Eye, EyeOff, Download, Upload,
  CheckCircle2, AlertTriangle, Database, RefreshCw
} from 'lucide-react';
import {
  getEncryptionPassphrase,
  setCustomEncryptionPassphrase,
  resetEncryptionKey,
} from '../services/crypto';
import { storage } from '../services/storage';

interface EncryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const EncryptionModal: React.FC<EncryptionModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [passphrase, setPassphrase] = useState(getEncryptionPassphrase());
  const [newPassphrase, setNewPassphrase] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [inspection, setInspection] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showRawInspector, setShowRawInspector] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassphrase(getEncryptionPassphrase());
      setInspection(storage.getRawStorageInspection());
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassphrase || newPassphrase.length < 6) {
      setStatusMsg({ text: 'Passphrase must be at least 6 characters long.', type: 'error' });
      return;
    }

    try {
      // Re-encrypt existing sensitive records with new key
      const sales = await storage.getSalesRecords();
      const expenses = await storage.getExpenses();
      const users = await storage.getUsers();

      setCustomEncryptionPassphrase(newPassphrase);

      // Re-save with new key
      for (const s of sales) await storage.saveSaleRecord(s);
      for (const exp of expenses) await storage.saveExpense(exp);
      for (const u of users) await storage.saveUser(u);

      setPassphrase(newPassphrase);
      setNewPassphrase('');
      setInspection(storage.getRawStorageInspection());
      setStatusMsg({ text: 'Encryption key updated and local data re-encrypted successfully!', type: 'success' });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update encryption key', type: 'error' });
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = await storage.exportEncryptedBackup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agrismart-encrypted-vault-${new Date().toISOString().slice(0, 10)}.aes`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'Encrypted backup exported to file.', type: 'success' });
    } catch {
      setStatusMsg({ text: 'Backup export failed', type: 'error' });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        await storage.importEncryptedBackup(text);
        setStatusMsg({ text: 'Encrypted vault backup successfully restored!', type: 'success' });
        setInspection(storage.getRawStorageInspection());
        onDataChanged();
      } catch (err: any) {
        setStatusMsg({ text: 'Failed to restore: ' + (err.message || 'Invalid format'), type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Local Data Encryption Vault</h2>
              <p className="text-xs text-stone-500">Zero-knowledge AES-256 client storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
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

        <div className="mt-4 space-y-4">
          {/* Security Specification cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Algorithm</p>
              <p className="text-xs font-bold text-emerald-800 mt-0.5">AES-GCM (256-bit)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Key Derivation</p>
              <p className="text-xs font-bold text-stone-900 mt-0.5">PBKDF2 (100k rounds)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 col-span-2 sm:col-span-1">
              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">IV & Salt</p>
              <p className="text-xs font-bold text-stone-900 mt-0.5">96-bit IV / 128-bit Salt</p>
            </div>
          </div>

          {/* Sensitive Protected Data */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <p className="text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              Locally Encrypted Entities:
            </p>
            <ul className="text-xs text-stone-600 space-y-1 list-disc list-inside">
              <li>Farm Sales & Revenue invoices (Financial privacy)</li>
              <li>Operational Farm Expenses & Vendor receipts</li>
              <li>Farmer phone numbers, contact info & profile credentials</li>
              <li>Offline unsynced queue payloads prior to transmission</li>
            </ul>
          </div>

          {/* Current Master Passphrase & Update */}
          <form onSubmit={handleUpdatePassphrase} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Current Active Key / Passphrase
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={passphrase}
                  className="w-full text-xs font-mono px-3 py-2 bg-stone-100 rounded-lg border border-stone-200 text-stone-700 pr-10 select-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-stone-400 hover:text-stone-700"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Change Encryption Passphrase
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new 6+ char secret key..."
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium shrink-0"
                >
                  Update & Re-encrypt
                </button>
              </div>
            </div>
          </form>

          {/* Cryptographic Inspector Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowRawInspector(!showRawInspector)}
              className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              {showRawInspector ? 'Hide Raw LocalStorage Ciphertext' : 'Inspect Raw LocalStorage Ciphertext (Proof of Encryption)'}
            </button>

            {showRawInspector && inspection && (
              <div className="mt-2 p-3 bg-stone-900 text-stone-100 rounded-xl text-[11px] font-mono overflow-x-auto space-y-2 max-h-48 overflow-y-auto">
                <div>
                  <span className="text-emerald-400 font-bold">// agri_sales_enc_v1 (AES-GCM Base64 Ciphertext):</span>
                  <p className="break-all text-stone-300 select-all">
                    {inspection.salesEncryptedCiphertext.slice(0, 240)}... (truncated)
                  </p>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">// agri_expenses_enc_v1 (AES-GCM Base64 Ciphertext):</span>
                  <p className="break-all text-stone-300 select-all">
                    {inspection.expensesEncryptedCiphertext.slice(0, 240)}... (truncated)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Backup & Restore */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-700"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                Export Encrypted Vault
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-600" />
                Import Vault
                <input
                  type="file"
                  accept=".aes,.json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium ml-auto"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
