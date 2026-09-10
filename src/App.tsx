import React, { useState, useEffect } from 'react';
import { PharmaChainProvider, usePharmaChain } from './context/PharmaChainContext';
import { ThemeProvider } from './context/ThemeContext';
import { RoleNavHeader } from './components/navigation/RoleNavHeader';
import { AlertBanner } from './components/shared/AlertBanner';
import { QrScannerModal } from './components/shared/QrScannerModal';
import { RetailerDashboard } from './components/dashboards/RetailerDashboard';
import { DistributorDashboard } from './components/dashboards/DistributorDashboard';
import { ManufacturerDashboard } from './components/dashboards/ManufacturerDashboard';
import { WasteFacilityDashboard } from './components/dashboards/WasteFacilityDashboard';
import { RegulatorDashboard } from './components/dashboards/RegulatorDashboard';
import { PublicVerifyPage } from './components/public/PublicVerifyPage';
import { PublicStatsDashboard } from './components/public/PublicStatsDashboard';
import { AuthPortal } from './components/auth/AuthPortal';

const AppContent: React.FC = () => {
  const { currentRole, currentUser } = usePharmaChain();
  const [activeTab, setActiveTab] = useState<string>('RETAILER');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [showAuthPortal, setShowAuthPortal] = useState<boolean>(false);

  // Sync tab when persona/role is swapped via the testing dropdown
  useEffect(() => {
    if (['RETAILER', 'DISTRIBUTOR', 'MANUFACTURER', 'WASTE_FACILITY', 'REGULATOR'].includes(currentRole)) {
      setActiveTab(currentRole);
    }
  }, [currentRole]);

  // If user is completely logged out and explicitly requests auth
  if (!currentUser || showAuthPortal) {
    return <AuthPortal onSuccess={() => setShowAuthPortal(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-[#051612] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Persistent Alerts (e.g. Re-entry fraud detected) */}
      <AlertBanner />

      {/* Main Role & Feature Navigation Header */}
      <RoleNavHeader
        currentTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuthPortal={() => setShowAuthPortal(true)}
      />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'RETAILER' && <RetailerDashboard />}
        {activeTab === 'DISTRIBUTOR' && <DistributorDashboard />}
        {activeTab === 'MANUFACTURER' && <ManufacturerDashboard />}
        {activeTab === 'WASTE_FACILITY' && <WasteFacilityDashboard />}
        {activeTab === 'REGULATOR' && <RegulatorDashboard />}
        {activeTab === 'PUBLIC_VERIFY' && <PublicVerifyPage />}
        {activeTab === 'PUBLIC_STATS' && <PublicStatsDashboard />}
      </main>

      {/* Global Interactive QR Scanner Modal */}
      {isScannerOpen && (
        <QrScannerModal
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(batchNumber) => {
            setIsScannerOpen(false);
          }}
        />
      )}

      {/* Official Statutory Footer */}
      <footer className="bg-white dark:bg-[#071d18] border-t border-slate-200 dark:border-teal-900/60 py-6 text-slate-500 dark:text-teal-200/70 text-xs text-center no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-teal-100">
            Pharma Reverse Chain Compliance Platform © 2025. Built for India CDSCO statutory mandate.
          </p>
          <p className="text-slate-400 dark:text-teal-300/50 text-[11px]">
            Immutable SHA-256 Ledger • HMAC-Signed QR • Zero Re-Entry Guarantee • Schedule M & Rule 65 Compliant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <PharmaChainProvider>
        <AppContent />
      </PharmaChainProvider>
    </ThemeProvider>
  );
}

