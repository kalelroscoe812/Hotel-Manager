import React, { useState } from 'react';
import { Hotel, SignupPayload, UserLoginSession, UserRole, formatRole } from '../types';
import {
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Mail,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  hotels: Hotel[];
  onLogin: (usernameOrEmail: string, password?: string) => Promise<UserLoginSession>;
  onSignup: (payload: SignupPayload) => Promise<UserLoginSession>;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  hotels,
  onLogin,
  onSignup,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign in fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('FRONT_DESK');
  const [signupHotelId, setSignupHotelId] = useState<number | undefined>(
    hotels[0]?.id || undefined,
  );
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await onLogin(loginIdentifier.trim(), loginPassword);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupUsername.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!signupFirstName.trim() || !signupLastName.trim()) {
      setErrorMessage('First and last name are required.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await onSignup({
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        role: signupRole,
        hotelId: signupRole === 'ADMIN' ? undefined : signupHotelId,
      });
      setSuccessMessage('Account created successfully! Email notification dispatched via Resend.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] w-full flex flex-col items-center justify-center py-6">
      {/* Percentage-based Window Sizing: scales fluidly across viewports */}
      <div className="w-[94%] sm:w-[84%] md:w-[68%] lg:w-[48%] xl:w-[38%] max-w-xl mb-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-2xl text-xs text-slate-400 font-medium shadow-md">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-300">Secure Access Portal</span>
          <span className="ml-auto text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Encrypted Connection
          </span>
        </div>
      </div>

      {/* Main Authentication Card with percentage sizing */}
      <div className="w-[94%] sm:w-[84%] md:w-[68%] lg:w-[48%] xl:w-[38%] max-w-xl bg-slate-900 border border-slate-800 rounded-b-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-amber-500/20 font-bold">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Hotel Manager
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your hotel management workspace
          </p>
        </div>

        {/* Tab Selection: Sign In vs Sign Up with CSS Flex Wrapping & Fixed Box Sizing */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`inline-flex items-center justify-center min-w-[130px] h-10 px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
              activeTab === 'signin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`inline-flex items-center justify-center min-w-[130px] h-10 px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
              activeTab === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Authenticated Sign In Form */}
        {activeTab === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Username or Connected Email
              </label>
              <input
                type="text"
                autoComplete="username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Enter username or email..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition shadow-lg shadow-amber-500/20 box-border"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: User & Admin Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400">
                <strong className="text-white">Email Verification:</strong> A welcome confirmation will be dispatched to your email address upon registration.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John"
                  value={signupFirstName}
                  onChange={(e) => setSignupFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doe"
                  value={signupLastName}
                  onChange={(e) => setSignupLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Username *</label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="e.g. jdoe_admin"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. user@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Min 4 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-3.5 pr-9 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                    tabIndex={-1}
                  >
                    {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Confirm Password *</label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Account Role *
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="FRONT_DESK">Front Desk</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
                  <option value="GUEST">Guest</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Assigned Property
                </label>
                <select
                  disabled={signupRole === 'ADMIN'}
                  value={signupHotelId || ''}
                  onChange={(e) =>
                    setSignupHotelId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 transition"
                >
                  {signupRole === 'ADMIN' ? (
                    <option value="">All Properties (Global Access)</option>
                  ) : hotels.length === 0 ? (
                    <option value="">No hotels registered</option>
                  ) : (
                    hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (#{h.id})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition shadow-lg shadow-amber-500/20 box-border"
              >
                <span>
                  {isSubmitting
                    ? 'Creating Account...'
                    : `Register as ${formatRole(signupRole)}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Security Assurance Badge */}
        <div className="pt-3 border-t border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Secure 256-bit Encryption • Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
