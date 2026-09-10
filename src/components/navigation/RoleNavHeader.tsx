import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { Role } from '../../types/pharmachain';
import {
  ShieldCheck,
  Package,
  Truck,
  Building2,
  Flame,
  Scale,
  ScanLine,
  Activity,
  Search,
  Code2,
  AlertCircle,
  LogIn,
  LogOut,
} from 'lucide-react';
import { SwitchTestingPersona } from './SwitchTestingPersona';
import { SpringBootSpecModal } from '../shared/SpringBootSpecModal';

interface RoleNavHeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenScanner: () => void;
  onOpenAuthPortal?: () => void;
}

export const RoleNavHeader: React.FC<RoleNavHeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
  onOpenAuthPortal,
}) => {
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    logout,
  } = usePharmaChain();

  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  const navItems = [
    {
      id: 'RETAILER',
      role: 'RETAILER' as Role,
      label: 'Retailer',
      icon: Package,
    },
    {
      id: 'DISTRIBUTOR',
      role: 'DISTRIBUTOR' as Role,
      label: 'Distributor',
      icon: Truck,
    },
    {
      id: 'MANUFACTURER',
      role: 'MANUFACTURER' as Role,
      label: 'Manufacturer',
      icon: Building2,
    },
    {
      id: 'WASTE_FACILITY',
      role: 'WASTE_FACILITY' as Role,
      label: 'Waste Facility',
      icon: Flame,
    },
    {
      id: 'REGULATOR',
      role: 'REGULATOR' as Role,
      label: 'Regulator (CDSCO)',
      icon: Scale,
    },
    {
      id: 'PUBLIC_VERIFY',
      role: null,
      label: 'Public Verify',
      icon: Search,
    },
    {
      id: 'PUBLIC_STATS',
      role: null,
      label: 'Public Stats',
      icon: Activity,
    },
  ];

  const handleSelectNav = (item: typeof navItems[0]) => {
    if (item.role) {
      setCurrentRole(item.role);
    }
    onSelectTab(item.id);
  };

  return (
    <>
      <header className="bg-[#071d18] border-b border-teal-900/60 text-white sticky top-0 z-40 shadow-xl" id="role-nav-header">
        {/* Top utility row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-teal-900/50">
          
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">
                  PharmaChain Compliance
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[9.5px] font-bold border border-teal-500/30">
                  v2025.1
                </span>
              </div>
              <p className="text-[10px] text-teal-200/70 hidden sm:block">
                Reverse Supply Chain & Tamper-Evident Destruction Registry
              </p>
            </div>
          </div>

          {/* Center Action Badges & Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* 1 Urgent (≤3d) */}
            <button
              id="urgent-expiry-alert-btn"
              type="button"
              onClick={() => {
                setCurrentRole('RETAILER');
                onSelectTab('RETAILER');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/50 text-[11px] font-bold shadow-xs transition-colors group animate-pulse"
              title="Click to view urgent expiring batch (Paracetamol 650mg ≤3d remaining)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 group-hover:scale-125 transition-transform" />
              <span>1 Urgent (≤3d)</span>
            </button>

            {/* Scan / OCR Batch */}
            <button
              id="top-scan-batch-btn"
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/50 text-[11px] font-semibold transition-colors"
            >
              <ScanLine className="w-3.5 h-3.5 text-teal-300" />
              <span>Scan / OCR Batch</span>
            </button>

            {/* Spring Boot Spec */}
            <button
              id="top-spring-boot-spec-btn"
              type="button"
              onClick={() => setIsSpecModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/50 text-[11px] font-semibold transition-colors hidden md:flex"
            >
              <Code2 className="w-3.5 h-3.5 text-teal-300" />
              <span>Spring Boot Spec</span>
            </button>

            {/* Public Verify */}
            <button
              id="top-public-verify-btn"
              type="button"
              onClick={() => onSelectTab('PUBLIC_VERIFY')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/50 text-[11px] font-semibold transition-colors hidden sm:flex"
            >
              <Search className="w-3.5 h-3.5 text-teal-300" />
              <span>Public Verify</span>
            </button>
          </div>

          {/* Right Controls: Switch Testing Persona dropdown & Auth Portal */}
          <div className="flex items-center gap-2">
            <SwitchTestingPersona />

            {/* Sign in / Switch License Button */}
            {onOpenAuthPortal && (
              <button
                id="header-open-auth-portal-btn"
                type="button"
                onClick={onOpenAuthPortal}
                className="p-1.5 rounded-lg text-teal-300/80 hover:text-teal-100 hover:bg-teal-800/50 border border-teal-700/40 transition-colors"
                title="Switch License / Onboard Portal"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Role Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none py-1.5 flex items-center gap-1.5 bg-[#051713]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-role-${item.id.toLowerCase()}`}
                onClick={() => handleSelectNav(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-sm font-bold ring-1 ring-teal-500/50'
                    : 'text-teal-200/70 hover:text-white hover:bg-teal-950/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Spring Boot 3.x Backend Architecture Spec Modal */}
      <SpringBootSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />
    </>
  );
};
