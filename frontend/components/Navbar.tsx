import React from 'react';
import {
  Building2,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { UserLoginSession, formatRole } from '../types';

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
}) => {
  const roleLabel = session
    ? {
        ADMIN: 'Admin Console',
        FRONT_DESK: 'Front Desk',
        PROPERTY_MANAGER: 'Property Manager',
        MAINTENANCE_ENGINEER: 'Maintenance',
        GUEST: 'Guest Portal',
      }[session.role] || formatRole(session.role)
    : '';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      {/* Percentage-based Window Sizing: w-[94%] sm:w-[92%] lg:w-[88%] */}
      <div className="w-[94%] sm:w-[92%] lg:w-[88%] max-w-7xl mx-auto py-3">
        <div className="flex flex-wrap items-center justify-between gap-4 min-h-[48px]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Hotel Manager</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Enterprise
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Property Management System
              </div>
            </div>
          </div>

          {/* Navigation Links with CSS Flex Wrapping & Fixed Box Sizes */}
          <nav className="flex flex-wrap items-center gap-2.5 text-xs">
            {session && (
              <button
                type="button"
                onClick={() => setCurrentTab('role-view')}
                className={`inline-flex items-center justify-center min-w-[130px] h-9 px-3.5 rounded-xl font-bold transition shrink-0 shadow-sm ${
                  currentTab === 'role-view'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                <span>{roleLabel}</span>
              </button>
            )}
          </nav>

          {/* User Session & Logout with CSS Flex Wrapping & Fixed Box Sizes */}
          <div className="flex flex-wrap items-center gap-2.5">
            {session ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">@{session.username}</div>
                  <div className="text-[10px] text-amber-400 font-semibold flex items-center justify-end gap-1">
                    <span>{formatRole(session.role)}</span>
                    {session.email && (
                      <span className="text-slate-400 font-normal truncate max-w-[140px]" title={session.email}>
                        • {session.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center justify-center min-w-[95px] h-9 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('login')}
                className={`inline-flex items-center justify-center min-w-[100px] h-9 px-4 py-1.5 rounded-xl text-xs font-bold transition shrink-0 shadow-md ${
                  currentTab === 'login'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
