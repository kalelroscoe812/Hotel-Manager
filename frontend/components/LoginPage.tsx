import React, { useState } from 'react';
import { User, UserLoginSession } from '../types';
import { Building2, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLogin: (session: UserLoginSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastResolvedAction, setLastResolvedAction] = useState<any | null>(null);

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const user = users.find(
      (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!user) {
      setErrorMessage(
        `User "${usernameInput}" not found in database. Try one of the test accounts below.`
      );
      return;
    }

    const session: UserLoginSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      hotelId: user.hotelId,
    };

    setLastResolvedAction(session);
    setTimeout(() => {
      onLogin(session);
    }, 400);
  };

  const selectQuickAccount = (uname: string) => {
    setUsernameInput(uname);
    setErrorMessage('');
    const user = users.find((u) => u.username === uname);
    if (user) {
      const session: UserLoginSession = {
        userId: user.id,
        username: user.username,
        role: user.role,
        hotelId: user.hotelId,
      };
      setLastResolvedAction(session);
      setTimeout(() => {
        onLogin(session);
      }, 300);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Simulated URL Bar from Assignment Doc */}
      <div className="w-full max-w-lg mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-t-xl text-xs text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-white">https://hotelmanager.com</span>
          <span className="ml-auto text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
            Deliverable Oct 27
          </span>
        </div>
      </div>

      {/* Main Login Card - Matching Assignment Spec */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-b-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-amber-500/20">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hotel Manager Portal</h1>
          <p className="text-xs text-slate-400">
            Course Technical Details Specification • Role-Based Authentication
          </p>
        </div>

        {/* ASCII/Spec style frame */}
        <div className="border border-dashed border-slate-700/80 rounded-xl p-6 bg-slate-950/70 space-y-4">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono font-semibold text-slate-300">
                  username:
                </label>
                <span className="text-[10px] text-slate-500">Case-insensitive</span>
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your username..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>[LOGIN]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Action Spec note */}
          {lastResolvedAction && (
            <div className="pt-3 border-t border-slate-800 text-xs font-mono text-emerald-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACTION: on login click -&gt; Resolved:</span>
              </div>
              <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300">
                [ userid: {lastResolvedAction.userId}, username: "{lastResolvedAction.username}", role: "{lastResolvedAction.role}", hotel_id: {lastResolvedAction.hotelId || 'None'} ]
              </div>
            </div>
          )}
        </div>

        {/* Quick Test Accounts for Grading & Demo */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Quick Role Test Accounts:
            </span>
            <span className="text-[10px] text-amber-400">Click to auto-login</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => selectQuickAccount('admin')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition group"
            >
              <div className="font-bold text-white group-hover:text-amber-300">admin</div>
              <div className="text-[10px] text-amber-400 font-semibold">ROLE: ADMIN</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('frontdesk_jane')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-left transition group"
            >
              <div className="font-bold text-white group-hover:text-blue-300">frontdesk_jane</div>
              <div className="text-[10px] text-blue-400 font-semibold">ROLE: FRONT_DESK</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('manager_mike')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
            >
              <div className="font-bold text-white group-hover:text-emerald-300">manager_mike</div>
              <div className="text-[10px] text-emerald-400 font-semibold">ROLE: PROPERTY_MANAGER</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('engineer_bob')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left transition group"
            >
              <div className="font-bold text-white group-hover:text-purple-300">engineer_bob</div>
              <div className="text-[10px] text-purple-400 font-semibold">ROLE: MAINTENANCE_ENGINEER</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
