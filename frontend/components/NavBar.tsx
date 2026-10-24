import React from 'react';
import {
  Building2,
  Terminal,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import { UserLoginSession } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserLoginSession | null;
  onLogout: () => void;
  onOpenCreateHotel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  session,
  onLogout,
  onOpenCreateHotel,
}) => {
  const roleLabel = session ? {
    ADMIN: 'ADMIN VIEW',
    FRONT_DESK: 'FRONT DESK',
    PROPERTY_MANAGER: 'PROP MANAGER',
    MAINTENANCE_ENGINEER: 'MAINTENANCE',
    GUEST: 'GUEST',
  }[session.role] : '';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Hotel Manager</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20">
                  Oct 27 Deliverable
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                FastAPI Backend • React UI • 0 Breaking Changes
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            {session && (
              <button
                onClick={() => setCurrentTab('role-view')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
                  currentTab === 'role-view'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{roleLabel}</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('audit')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
                currentTab === 'audit'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Deliverables & PR Audit</span>
            </button>

            <button
              onClick={() => setCurrentTab('api')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition ${
                currentTab === 'api'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>FastAPI Docs</span>
            </button>
          </nav>

          {/* User Session & Logout */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">@{session.username}</div>
                  <div className="text-[10px] text-amber-400 font-semibold">{session.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                  title="Switch User / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Switch Role</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('login')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800 text-xs no-scrollbar">
          {session && (
            <button
              onClick={() => setCurrentTab('role-view')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap ${
                currentTab === 'role-view' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 bg-slate-900'
              }`}
            >
              {roleLabel}
            </button>
          )}
          <button
            onClick={() => setCurrentTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap ${
              currentTab === 'audit' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400 bg-slate-900'
            }`}
          >
            Deliverables & PR Audit
          </button>
          <button
            onClick={() => setCurrentTab('api')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              currentTab === 'api' ? 'bg-slate-800 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            FastAPI Docs
          </button>
        </div>
      </div>
    </header>
  );
};
