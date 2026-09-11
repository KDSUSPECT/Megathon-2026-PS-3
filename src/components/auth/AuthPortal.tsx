import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Building2,
  Store,
  Truck,
  Flame,
  KeyRound,
  ArrowRight,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { Role } from '../../types/pharmachain';

interface QuickRoleCard {
  role: Role;
  label: string;
  name: string;
  entityName: string;
  username: string;
  license: string;
  pin: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const QUICK_ROLES: QuickRoleCard[] = [
  {
    role: 'RETAILER',
    label: 'Apollo / RETAILER',
    name: 'Retailer (Apollo Pharmacy)',
    entityName: 'Apollo Medicos #402',
    username: 'retailer.apollo',
    license: 'DL-2024-RET-88129',
    pin: '1234',
    icon: Store,
    color: 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100/70',
  },
  {
    role: 'DISTRIBUTOR',
    label: 'Medilogix / DISTRIBUTOR',
    name: 'Distributor (Medilogix Logistics)',
    entityName: 'Medilogix Logistics Hub',
    username: 'distributor.medlink',
    license: 'DL-2023-DIS-33014',
    pin: '1234',
    icon: Truck,
    color: 'text-cyan-800 bg-cyan-50 border-cyan-200 hover:bg-cyan-100/70',
  },
  {
    role: 'MANUFACTURER',
    label: 'Sun / MANUFACTURER',
    name: 'Manufacturer (Sun Pharma)',
    entityName: 'Sun Pharma Baddi Unit III',
    username: 'mfr.cipla',
    license: 'MFG-2022-IND-00412',
    pin: '1234',
    icon: Building2,
    color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
  },
  {
    role: 'WASTE_FACILITY',
    label: 'CleanEco / WASTE_FACILITY',
    name: 'Waste Facility (CleanEco Waste)',
    entityName: 'CleanEco Hazardous Incinerator',
    username: 'waste.greenearth',
    license: 'CPCB-HAZ-2024-887',
    pin: '1234',
    icon: Flame,
    color: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100/70',
  },
  {
    role: 'REGULATOR',
    label: 'Dr. / REGULATOR',
    name: 'Regulator (Dr. Verma CDSCO)',
    entityName: 'Dr. R.K. Verma (CDSCO Enforcement)',
    username: 'regulator.cdsco',
    license: 'CDSCO-WZ-REG-01',
    pin: '1234',
    icon: ShieldCheck,
    color: 'text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100/70',
  },
];

interface AuthPortalProps {
  onSuccess?: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onSuccess }) => {
  const { loginWithCredentials, registerEntity } = usePharmaChain();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Sign In State
  const [loginUsername, setLoginUsername] = useState('retailer.apollo');
  const [loginLicense, setLoginLicense] = useState('DL-2024-RET-88129');
  const [loginPassword, setLoginPassword] = useState('1234');
  const [loginPin, setLoginPin] = useState('1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration State
  const [regRole, setRegRole] = useState<Role>('RETAILER');
  const [regEntityName, setRegEntityName] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regOfficerName, setRegOfficerName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleQuickAutofill = (roleCard: QuickRoleCard) => {
    setLoginUsername(roleCard.username);
    setLoginLicense(roleCard.license);
    setLoginPassword('1234');
    setLoginPin(roleCard.pin);
    setLoginError(null);
  };

  const handleDirectRoleLogin = async (roleCard: QuickRoleCard) => {
    setLoginUsername(roleCard.username);
    setLoginLicense(roleCard.license);
    setLoginPin(roleCard.pin);
    const success = await loginWithCredentials(roleCard.username, roleCard.pin);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUsername.trim() && !loginLicense.trim()) {
      setLoginError('Please enter your authorized username or drug license number.');
      return;
    }

    const success = await loginWithCredentials(
      loginUsername || loginLicense,
      loginPin || loginPassword
    );

    if (success) {
      if (onSuccess) onSuccess();
    } else {
      setLoginError('Invalid license credentials or unrecognized entity in database.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regEntityName.trim() || !regLicense.trim() || !regUsername.trim() || !regPin.trim()) {
      setRegError('Please fill out all mandatory regulatory onboarding fields.');
      return;
    }

    if (regPin.trim().length < 4) {
      setRegError('Secure Signing PIN must be at least 4 digits.');
      return;
    }

    const ok = registerEntity({
      role: regRole,
      entityName: regEntityName,
      fullName: regOfficerName || regEntityName,
      licenseNumber: regLicense,
      username: regUsername,
      pin: regPin,
      email: regEmail || `${regUsername.toLowerCase()}@pharmachain.in`,
    });

    if (ok) {
      setRegSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setRegError('Failed to register drug license. License may already exist.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a201c] flex flex-col justify-center items-center p-4 sm:p-6 md:p-8" id="auth-portal-page">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-teal-900/40">
        
        {/* LEFT COLUMN: Deep dark forest green with CDSCO mandate branding */}
        <div className="lg:col-span-5 bg-[#071d18] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 shadow-inner">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">
                    PharmaChain Compliance
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    CDSCO 2025 Mandate Framework
                  </span>
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3">
              One record, from production to disposal.
            </h1>
            <p className="text-teal-200/80 text-[13px] leading-relaxed mb-6">
              India's cryptographic reverse chain compliance engine. Preventing expired drug repackaging and resale through mathematical proof, hash-chained ledgers, and automated collusion detection.
            </p>

            {/* Core Architectural Innovation Card */}
            <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-teal-300 uppercase mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                CORE ARCHITECTURAL INNOVATION
              </div>
              <p className="text-[12.5px] italic text-teal-100/90 leading-relaxed">
                &ldquo;We don't just digitize the workflow — we make fraud and collusion mathematically detectable, not just procedurally discouraged.&rdquo;
              </p>
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 pt-8 mt-6 border-t border-teal-900/60">
            <div className="flex items-center justify-between text-[11.5px] text-teal-300/80">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Every batch accounted for.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Central Drugs Standard Control Org</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Warm cream / off-white license auth portal */}
        <div className="lg:col-span-7 bg-[#FAF7F2] p-7 sm:p-9 flex flex-col justify-center">
          
          {mode === 'LOGIN' ? (
            /* ==================== SIGN IN VIEW ==================== */
            <div id="signin-view">
              {/* Header */}
              <div className="mb-5">
                <span className="text-[10.5px] font-bold tracking-wider text-amber-900/80 uppercase">
                  SECURE LICENSE VERIFICATION
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Sign In to Portal
                </h2>
                <p className="text-[13px] text-slate-600 mt-1">
                  Authentication directly links to your government-issued Drug License.
                </p>
              </div>

              {/* QUICK LOGIN (5 TEST ROLES) */}
              <div className="mb-5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10.5px] font-bold tracking-wider text-slate-700 uppercase">
                    Select Authorized Role to Enter:
                  </span>
                  <span className="text-[9.5px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    1-CLICK ENTER OR AUTOFILL
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {QUICK_ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = loginUsername === r.username;
                    return (
                      <div
                        key={r.role}
                        className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-xs border border-slate-200">
                            <Icon className="w-4 h-4 text-teal-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11.5px] font-bold text-slate-900 truncate leading-tight">
                              {r.name.split(' (')[0]}
                            </div>
                            <div className="text-[9.5px] font-mono text-slate-500 truncate">
                              {r.username}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDirectRoleLogin(r)}
                            className="flex-1 py-1 px-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold transition-all text-center"
                          >
                            Enter &rarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAutofill(r)}
                            className="py-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200 transition-all"
                            title="Autofill credentials in form"
                          >
                            Fill
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Citizen Quick Check Banner */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-semibold text-slate-700">
                      Public Citizen / Consumer Tablet Safety Check
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Log in as CDSCO regulator / public guest and go to public verify
                      const regRole = QUICK_ROLES.find((r) => r.role === 'REGULATOR');
                      if (regRole) {
                        loginWithCredentials(regRole.username, regRole.pin);
                      }
                      if (onSuccess) onSuccess();
                    }}
                    className="text-[10.5px] font-bold text-teal-800 hover:text-teal-900 hover:underline flex items-center gap-1"
                  >
                    Verify Tablet Safety &rarr;
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Form inputs */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    id="login-username-input"
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. apollo_pharmacy"
                    className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      License Number (Determines Authorized Role)
                    </label>
                  </div>
                  <input
                    id="login-license-input"
                    type="text"
                    value={loginLicense}
                    onChange={(e) => setLoginLicense(e.target.value)}
                    placeholder="e.g. DL-2024-RET-88129"
                    className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono uppercase"
                    required
                  />
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Validates Pharmacy / Distributor / Manufacturer / Facility / CDSCO license.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password-input"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                        Secure Signing PIN (4-6 Digits)
                      </label>
                    </div>
                    <input
                      id="login-pin-input"
                      type="password"
                      maxLength={6}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="e.g. 8812"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono tracking-widest text-center"
                      required
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * PIN digitally authorizes critical custody transfers and status changes onto the immutable ledger.
                </p>

                <button
                  id="sign-in-submit-button"
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group mt-2"
                >
                  <span>Sign In with License Credentials</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>

              {/* Toggle to Register */}
              <div className="mt-5 pt-4 border-t border-slate-200 text-center">
                <button
                  id="toggle-to-register-btn"
                  type="button"
                  onClick={() => {
                    setMode('REGISTER');
                    setLoginError(null);
                  }}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors"
                >
                  New to PharmaChain? <span className="underline">Register authorized drug license</span>
                </button>
              </div>
            </div>
          ) : (
            /* ==================== REGISTER VIEW ==================== */
            <div id="register-view">
              {/* Header */}
              <div className="mb-4">
                <span className="text-[10.5px] font-bold tracking-wider text-amber-900/80 uppercase">
                  STATUTORY DRUG LICENSE ONBOARDING
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Register Authorized Drug License
                </h2>
                <p className="text-[13px] text-slate-600 mt-0.5">
                  CDSCO Schedule M & Rule 65 compliant cryptographic participant enrollment.
                </p>
              </div>

              {regSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-base">License Registered Successfully!</div>
                  <p className="text-xs text-emerald-700">
                    Digital ledger participant identity issued. Logging into your portal...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {regError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Role selection chips */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Statutory Role
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {(['RETAILER', 'DISTRIBUTOR', 'MANUFACTURER', 'WASTE_FACILITY', 'REGULATOR'] as Role[]).map(
                        (r) => {
                          const isSelected = regRole === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRegRole(r)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left truncate ${
                                isSelected
                                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {r === 'WASTE_FACILITY' ? 'WASTE FACILITY' : r}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Facility / Entity Name
                      </label>
                      <input
                        id="reg-entity-name"
                        type="text"
                        value={regEntityName}
                        onChange={(e) => setRegEntityName(e.target.value)}
                        placeholder="e.g. Fortis Medicos #12"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Drug License / Authorization #
                      </label>
                      <input
                        id="reg-license-number"
                        type="text"
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                        placeholder="e.g. DL-2025-RET-99411"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Authorized Officer Name
                      </label>
                      <input
                        id="reg-officer-name"
                        type="text"
                        value={regOfficerName}
                        onChange={(e) => setRegOfficerName(e.target.value)}
                        placeholder="e.g. Dr. Sneha Roy"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Login Username
                      </label>
                      <input
                        id="reg-username"
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. fortis_medicos12"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                        Secure Signing PIN (4-6 Digits)
                      </label>
                      <input
                        id="reg-pin"
                        type="password"
                        maxLength={6}
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        placeholder="e.g. 9941"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-center tracking-widest"
                        required
                      />
                    </div>
                  </div>

                  <button
                    id="register-submit-button"
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group mt-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Register & Issue Digital Ledger Identity</span>
                  </button>
                </form>
              )}

              {/* Toggle to Sign In */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                <button
                  id="toggle-to-login-btn"
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setRegError(null);
                  }}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors"
                >
                  Already registered? <span className="underline">Sign In to Portal</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
