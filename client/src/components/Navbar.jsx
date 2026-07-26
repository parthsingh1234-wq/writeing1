import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOffline } from '../context/OfflineContext';
import {
  PenSquare, Sun, Moon, Monitor, Search, User, LogOut, Shield,
  Wifi, WifiOff, RefreshCw, Folder, Trash2, Image as ImageIcon
} from 'lucide-react';

export const Navbar = ({ onSearchChange, searchValue }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline, syncQueueCount, isSyncing, triggerSync } = useOffline();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-black text-sm tracking-widest shadow-sm group-hover:bg-red-700 dark:group-hover:bg-red-600 dark:group-hover:text-white transition-colors">
              AV
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold font-serif-headline text-xl text-slate-900 dark:text-white tracking-tight group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                Article Vault
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                CMS
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Input */}
        {onSearchChange !== undefined && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search stories, categories, authors, tags..."
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-xs font-medium bg-slate-100/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-slate-100/20 focus:border-slate-400 dark:focus:border-slate-600 transition-all placeholder:text-slate-400"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md pointer-events-none">
                ⌘K
              </kbd>
            </div>
          </div>
        )}

        {/* Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Offline Sync Status Indicator */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline ({syncQueueCount})</span>
            </div>
          ) : syncQueueCount > 0 ? (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-medium hover:bg-indigo-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {syncQueueCount} Drafts</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => toggleTheme('light')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleTheme('system')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="System Theme"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAuthenticated ? (
            <>
              <Link
                to="/editor/new"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs shadow-sm hover:shadow transition-all"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Write Story</span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
                  />
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          System Admin
                        </span>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile & Settings</span>
                    </Link>

                    <Link
                      to="/images"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Image Library</span>
                    </Link>

                    <Link
                      to="/trash"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Recycle Bin</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 font-medium rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
