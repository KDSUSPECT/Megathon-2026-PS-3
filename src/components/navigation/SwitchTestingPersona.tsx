import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Truck,
  Building2,
  Flame,
  ShieldCheck,
  ChevronDown,
  Check,
  ExternalLink,
} from 'lucide-react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { Role } from '../../types/pharmachain';

interface PersonaOption {
  role: Role;
  name: string;
  subName: string;
  license: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  roleLabel: string;
}

const PERSONAS: PersonaOption[] = [
  {
    role: 'RETAILER',
    name: 'Retailer (Apollo Pharmacy)',
    subName: 'Apollo Medicos #402',
    license: 'DL-2024-RET-88129',
    icon: Store,
    accentColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    roleLabel: 'RETAILER',
  },
  {
    role: 'DISTRIBUTOR',
    name: 'Distributor (Medilogix Logistics)',
    subName: 'Medilogix Logistics Hub',
    license: 'DL-2023-DIS-33014',
    icon: Truck,
    accentColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    roleLabel: 'DISTRIBUTOR',
  },
  {
    role: 'MANUFACTURER',
    name: 'Manufacturer (Sun Pharma)',
    subName: 'Sun Pharma Baddi Unit III',
    license: 'MFG-2022-IND-00412',
    icon: Building2,
    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    roleLabel: 'MANUFACTURER',
  },
  {
    role: 'WASTE_FACILITY',
    name: 'Waste Facility (CleanEco Waste)',
    subName: 'CleanEco Hazardous Incinerator',
    license: 'CPCB-HAZ-2024-887',
    icon: Flame,
    accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    roleLabel: 'WASTE FACILITY',
  },
  {
    role: 'REGULATOR',
    name: 'Regulator (Dr. Verma CDSCO)',
    subName: 'Dr. R.K. Verma (CDSCO Enforcement)',
    license: 'CDSCO-WZ-REG-01',
    icon: ShieldCheck,
    accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    roleLabel: 'REGULATOR',
  },
];

export const SwitchTestingPersona: React.FC = () => {
  const { currentUser, currentRole, switchPersonaDevEndpoint } = usePharmaChain();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activePersona = PERSONAS.find((p) => p.role === currentRole) || PERSONAS[0];
  const ActiveIcon = activePersona.icon;

  const handleSelectPersona = async (persona: PersonaOption) => {
    if (persona.role === currentRole && !switching) {
      setIsOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchPersonaDevEndpoint(persona.role);
      setFeedback(`Swapped to ${persona.roleLabel}`);
      setTimeout(() => setFeedback(null), 2400);
      setIsOpen(false);
    } finally {
      setSwitching(false);
    }
  };

  const displayName = currentUser?.entityName || currentUser?.fullName || activePersona.name;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="persona-switcher-container">
      {/* Collapsed state: pill-shaped button on right side of top nav */}
      <button
        id="switch-persona-pill-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#0d2a24] dark:hover:bg-[#133931] border border-slate-300 dark:border-teal-500/30 hover:border-slate-400 dark:hover:border-teal-400/50 shadow-xs transition-all duration-150 text-left focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        title="Click to switch demo testing persona"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Entity icon inside small badge */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-300 dark:border-teal-500/40">
          <ActiveIcon className="w-3.5 h-3.5" />
        </div>

        {/* Stacked two lines: Name on top, Role label in smaller gray/teal caps below */}
        <div className="flex flex-col text-left leading-tight pr-1 min-w-[130px] max-w-[210px]">
          <span className="text-[12.5px] font-semibold text-slate-900 dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-200 transition-colors">
            {displayName}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
            {activePersona.roleLabel}
          </span>
        </div>

        {/* Small chevron-down arrow on right edge */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 dark:text-teal-300/80 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-700 dark:text-teal-200' : ''
          }`}
        />
      </button>

      {/* Floating feedback badge */}
      {feedback && (
        <div className="absolute right-0 -bottom-8 px-2 py-0.5 rounded bg-teal-800 dark:bg-teal-900/90 text-white dark:text-teal-200 text-[10px] font-medium shadow-md border border-teal-600 dark:border-teal-500/40 animate-fade-in whitespace-nowrap z-50">
          {feedback}
        </div>
      )}

      {/* Expanded state: Dropdown panel */}
      {isOpen && (
        <div
          id="switch-persona-dropdown-panel"
          className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#071d18] shadow-2xl border border-slate-200 dark:border-teal-900/60 py-2.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100 text-slate-800 dark:text-slate-100 ring-1 ring-black/10 dark:ring-teal-900/40"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header text & subtitle */}
          <div className="px-3.5 pb-2 border-b border-slate-100 dark:border-teal-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
                SWITCH TESTING PERSONA
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/60">
                POST /api/dev
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-teal-300/70 mt-0.5">
              Test workflows across India CDSCO mandated roles:
            </p>
          </div>

          {/* List of 5 selectable personas */}
          <div className="py-1 px-1.5 space-y-0.5" role="none">
            {PERSONAS.map((persona) => {
              const Icon = persona.icon;
              const isSelected = persona.role === currentRole;

              return (
                <button
                  key={persona.role}
                  id={`persona-option-${persona.role.toLowerCase()}`}
                  type="button"
                  onClick={() => handleSelectPersona(persona)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800/80 text-teal-950 dark:text-white font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-200 border border-transparent'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-teal-950/50 text-slate-600 dark:text-teal-300 border-slate-200 dark:border-teal-800/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold truncate text-slate-900 dark:text-white leading-snug">
                        {persona.name}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-500 dark:text-teal-300/70 truncate">
                        {persona.license}
                      </div>
                    </div>
                  </div>

                  {/* Active persona indicator */}
                  {isSelected ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800 animate-pulse" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-teal-400/60 font-medium uppercase group-hover:text-slate-600 dark:group-hover:text-teal-300">
                      Select
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subtext info at bottom of dropdown */}
          <div className="mt-1 pt-2 px-3.5 border-t border-slate-100 dark:border-teal-900/40 flex items-center justify-between text-[10px] text-slate-400 dark:text-teal-300/60">
            <span>Dev / Demo Instant Persona Swapper</span>
            <span className="font-mono text-[9px] text-teal-600 dark:text-teal-400">v2025.1</span>
          </div>
        </div>
      )}
    </div>
  );
};
