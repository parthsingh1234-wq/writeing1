import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Edit3, Image as ImageIcon,
  FolderTree, Trash2, Shield, Settings, Compass
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'All Articles', path: '/articles', icon: Compass },
    { name: 'My Drafts', path: '/drafts', icon: Edit3 },
    { name: 'Image Library', path: '/images', icon: ImageIcon },
    { name: 'Categories & Tags', path: '/categories', icon: FolderTree },
    { name: 'Recycle Bin', path: '/trash', icon: Trash2 },
  ];

  return (
    <aside className="w-60 hidden md:flex flex-col gap-2 p-4 bg-white/60 dark:bg-[#0B0F17]/60 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)]">
      <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-1">
        Editorial Desk
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {isAdmin && (
        <>
          <div className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest px-3 mt-6 mb-1">
            System Admin
          </div>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                isActive
                  ? 'bg-red-700 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400'
              }`
            }
          >
            <Shield className="w-4 h-4" />
            <span>Admin Console</span>
          </NavLink>
        </>
      )}

      <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white"
        >
          <Settings className="w-4 h-4" />
          <span>Account Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
