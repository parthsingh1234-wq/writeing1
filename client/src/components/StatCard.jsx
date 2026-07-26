import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'slate', subtext }) => {
  const colorMap = {
    indigo: 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return (
    <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-extrabold font-sans text-slate-900 dark:text-white mt-1 tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.slate} transition-transform group-hover:scale-105`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
