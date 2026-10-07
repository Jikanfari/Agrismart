/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AccessibilityProvider,
  useAccessibility,
} from './hooks/useAccessibility';
import { Header } from './components/Header';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { BottomNav, NavigationTab } from './components/BottomNav';
import { AccessibilityModal } from './components/AccessibilityModal';
import { EncryptionModal } from './components/EncryptionModal';
import { QRCodeScannerModal } from './components/scanner/QRCodeScannerModal';
import { LockScreenModal } from './components/auth/LockScreenModal';
import { AuthSetupModal } from './components/auth/AuthSetupModal';
import { FarmerRegistrationModal } from './components/auth/FarmerRegistrationModal';

import { FarmerDashboard } from './components/dashboard/FarmerDashboard';
import { FarmManagement } from './components/farms/FarmManagement';
import { EnvironmentMonitoring } from './components/environment/EnvironmentMonitoring';
import { AlertsAndRules } from './components/alerts/AlertsAndRules';
import { FarmRecords } from './components/records/FarmRecords';
import { ReportsAndCharts } from './components/reports/ReportsAndCharts';
import { AdminPanel } from './components/admin/AdminPanel';

import { storage } from './services/storage';
import { syncEngine, SyncStatus } from './services/syncEngine';
import { authService, PRESET_USERS } from './services/authService';
import { evaluateHarvestReminders } from './services/rulesEngine';
import {
  Farm, Plot, Crop, SensorReading, IrrigationAlert, FarmActivity,
  FertilizerRecord, HarvestRecord, SaleRecord, ExpenseRecord, User,
  DecisionRulesConfig, AuthSession
} from './types';

function MainApp() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Modals
  const [isEncryptionModalOpen, setIsEncryptionModalOpen] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAuthSetupOpen, setIsAuthSetupOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Auth & Session state
  const [authSession, setAuthSession] = useState<AuthSession>(() => authService.getSession());

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncEngine.getStatus());

  // Application Data state
  const [currentUser, setCurrentUser] = useState<User>(() => authService.getSession().user);
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<IrrigationAlert[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [fertilizers, setFertilizers] = useState<FertilizerRecord[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Load all data
  const refreshAllData = async () => {
    setFarms(storage.getFarms());
    setPlots(storage.getPlots());
    const loadedCrops = storage.getCrops();
    setCrops(loadedCrops);
    setReadings(storage.getReadings());

    // Evaluate approaching harvests and merge alerts
    const loadedAlerts = storage.getAlerts();
    const harvestAlerts = evaluateHarvestReminders(loadedCrops);
    harvestAlerts.forEach((ha) => storage.addAlert(ha));
    setAlerts(storage.getAlerts());

    setActivities(storage.getActivities());
    setFertilizers(storage.getFertilizerRecords());
    setHarvests(storage.getHarvestRecords());

    // Decrypt sensitive records
    const [loadedSales, loadedExpenses, loadedUsers] = await Promise.all([
      storage.getSalesRecords(),
      storage.getExpenses(),
      storage.getUsers(),
    ]);
    setSales(loadedSales);
    setExpenses(loadedExpenses);
    setUsers(loadedUsers);
  };

  useEffect(() => {
    refreshAllData();

    // Subscribe to sync status changes
    const unsubscribeSync = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });

    // Subscribe to auth session & lock status changes
    const unsubscribeAuth = authService.subscribe((s) => {
      setAuthSession(s);
      setCurrentUser(s.user);
    });

    const handleUserChange = (e: any) => {
      if (e.detail) setCurrentUser(e.detail);
    };

    window.addEventListener('agrismart:user_change', handleUserChange);

    return () => {
      unsubscribeSync();
      unsubscribeAuth();
      window.removeEventListener('agrismart:user_change', handleUserChange);
    };
  }, []);

  // Handlers
  const handleToggleSimulatedOffline = (offline: boolean) => {
    storage.setSimulatedOffline(offline);
    setSyncStatus(syncEngine.getStatus());
  };

  const handleTriggerSync = async () => {
    await syncEngine.performSync();
    await refreshAllData();
  };

  const handleSwitchUser = (user: User) => {
    authService.loginUser(user);
    storage.setCurrentUser(user);
    setCurrentUser(user);
    refreshAllData();
  };

  const handleSaveFarm = (farm: Farm) => {
    storage.saveFarm(farm);
    refreshAllData();
  };

  const handleDeleteFarm = (farmId: string) => {
    storage.deleteFarm(farmId);
    refreshAllData();
  };

  const handleSavePlot = (plot: Plot) => {
    storage.savePlot(plot);
    refreshAllData();
  };

  const handleDeletePlot = (plotId: string) => {
    storage.deletePlot(plotId);
    refreshAllData();
  };

  const handleSaveCrop = (crop: Crop) => {
    storage.saveCrop(crop);
    refreshAllData();
  };

  const handleDeleteCrop = (cropId: string) => {
    storage.deleteCrop(cropId);
    refreshAllData();
  };

  const handleAddReading = (reading: SensorReading) => {
    storage.addReading(reading);
    refreshAllData();
  };

  const handleAlertGenerated = (alert: IrrigationAlert) => {
    storage.addAlert(alert);
    refreshAllData();
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    storage.updateAlertStatus(alertId, 'acknowledged');
    refreshAllData();
  };

  const handleResolveAlert = (alertId: string) => {
    storage.dismissAlert(alertId);
    refreshAllData();
  };

  const handleUpdateRulesConfig = (config: DecisionRulesConfig) => {
    storage.saveRulesConfig(config);
  };

  const handleSaveActivity = (activity: FarmActivity) => {
    storage.saveActivity(activity);
    refreshAllData();
  };

  const handleDeleteActivity = (id: string) => {
    storage.deleteActivity(id);
    refreshAllData();
  };

  const handleToggleActivityStatus = (id: string) => {
    const act = activities.find((a) => a.id === id);
    if (act) {
      const nextStatus = act.status === 'Completed' ? 'Pending' : 'Completed';
      storage.saveActivity({
        ...act,
        status: nextStatus,
        completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
      });
      refreshAllData();
    }
  };

  const handleSaveFertilizer = (rec: FertilizerRecord) => {
    storage.saveFertilizerRecord(rec);
    refreshAllData();
  };

  const handleDeleteFertilizer = (id: string) => {
    storage.deleteFertilizerRecord(id);
    refreshAllData();
  };

  const handleSaveHarvest = (rec: HarvestRecord) => {
    storage.saveHarvestRecord(rec);
    refreshAllData();
  };

  const handleDeleteHarvest = (id: string) => {
    storage.deleteHarvestRecord(id);
    refreshAllData();
  };

  const handleSavePest = (report: any) => {
    storage.savePestReport(report);
    refreshAllData();
  };

  const handleDeletePest = (id: string) => {
    storage.deletePestReport(id);
    refreshAllData();
  };

  const handleSaveExpense = async (exp: ExpenseRecord) => {
    await storage.saveExpense(exp);
    await refreshAllData();
  };

  const handleSaveUser = async (user: User) => {
    await storage.saveUser(user);
    refreshAllData();
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Mobile App Shell Bar */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        availableUsers={users.length > 0 ? users : PRESET_USERS}
        isOnline={syncStatus.isOnline}
        isSimulatedOffline={syncStatus.isSimulatedOffline}
        onOpenEncryptionModal={() => setIsEncryptionModalOpen(true)}
        onOpenAccessibilityModal={() => setIsAccessibilityModalOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenAuthModal={() => setIsAuthSetupOpen(true)}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onLockNow={() => authService.lockSession()}
        hasPin={authSession.hasPin}
      />

      {/* Offline Status & Auto Sync Banner */}
      <OfflineSyncBanner
        syncStatus={syncStatus}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        onTriggerSync={handleTriggerSync}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {currentTab === 'dashboard' && (
          <FarmerDashboard
            farms={farms}
            plots={plots}
            crops={crops}
            readings={readings}
            alerts={alerts}
            activities={activities}
            onOpenRecordReading={() => setCurrentTab('environment')}
            onOpenScheduleActivity={() => setCurrentTab('records')}
            onOpenLogHarvest={() => setCurrentTab('records')}
            onOpenPestReport={() => setCurrentTab('records')}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onSelectPlot={() => {}}
            onToggleActivityStatus={handleToggleActivityStatus}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'farms' && (
          <FarmManagement
            farms={farms}
            plots={plots}
            crops={crops}
            onSaveFarm={handleSaveFarm}
            onDeleteFarm={handleDeleteFarm}
            onSavePlot={handleSavePlot}
            onDeletePlot={handleDeletePlot}
            onSaveCrop={handleSaveCrop}
            onDeleteCrop={handleDeleteCrop}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}

        {currentTab === 'environment' && (
          <EnvironmentMonitoring
            plots={plots}
            crops={crops}
            readings={readings}
            onAddReading={handleAddReading}
            onAlertGenerated={handleAlertGenerated}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsAndRules
            alerts={alerts}
            plots={plots}
            crops={crops}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
            onUpdateRulesConfig={handleUpdateRulesConfig}
          />
        )}

        {currentTab === 'records' && (
          <FarmRecords
            plots={plots}
            crops={crops}
            activities={activities}
            fertilizers={fertilizers}
            harvests={harvests}
            pests={storage.getPestReports()}
            onSaveActivity={handleSaveActivity}
            onDeleteActivity={handleDeleteActivity}
            onToggleActivityStatus={handleToggleActivityStatus}
            onSaveFertilizer={handleSaveFertilizer}
            onDeleteFertilizer={handleDeleteFertilizer}
            onSaveHarvest={handleSaveHarvest}
            onDeleteHarvest={handleDeleteHarvest}
            onSavePest={handleSavePest}
            onDeletePest={handleDeletePest}
            onReloadEncryptedRecords={refreshAllData}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsAndCharts
            plots={plots}
            crops={crops}
            readings={readings}
            harvests={harvests}
            activities={activities}
            sales={sales}
            expenses={expenses}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            users={users}
            onSaveUser={handleSaveUser}
            onOpenEncryptionModal={() => setIsEncryptionModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        activeAlertsCount={activeAlertsCount}
        userRole={currentUser.role}
      />

      {/* Accessibility Preferences Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityModalOpen}
        onClose={() => setIsAccessibilityModalOpen(false)}
      />

      {/* AES-256 Local Encryption Vault Modal */}
      <EncryptionModal
        isOpen={isEncryptionModalOpen}
        onClose={() => setIsEncryptionModalOpen(false)}
        onDataChanged={refreshAllData}
      />

      {/* Seed Packet & Fertilizer Bag Camera QR Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQRScannerOpen}
        plots={plots}
        onClose={() => setIsQRScannerOpen(false)}
        onSaveCrop={handleSaveCrop}
        onSaveFertilizer={handleSaveFertilizer}
        onSaveExpense={handleSaveExpense}
      />

      {/* Offline 4-Digit PIN & Biometric Vault Lockscreen */}
      <LockScreenModal
        isLocked={authSession.isLocked}
        currentUser={currentUser}
        onUnlocked={() => setAuthSession(authService.getSession())}
        onSwitchUser={handleSwitchUser}
        availableUsers={users.length > 0 ? users : PRESET_USERS}
      />

      {/* Authentication & Security Settings Modal */}
      <AuthSetupModal
        isOpen={isAuthSetupOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthSetupOpen(false)}
        onUserChanged={handleSwitchUser}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      />

      {/* Farmer Registration & Site Onboarding Modal */}
      <FarmerRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegistered={(newUser, newFarm) => {
          handleSwitchUser(newUser);
          refreshAllData();
          setCurrentTab('dashboard');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <MainApp />
    </AccessibilityProvider>
  );
}
