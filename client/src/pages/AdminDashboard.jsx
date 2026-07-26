import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { StatCard } from '../components/StatCard';
import { Shield, Users, FileText, CheckCircle, Trash2, Edit } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users')
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
    } catch (err) {
      console.error('Failed to load admin console data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user account?')) {
      try {
        await API.delete(`/admin/users/${id}`);
        fetchAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Admin Console</h1>
          <p className="text-xs text-slate-500">Platform-wide statistics, moderation, and user account management</p>
        </div>
      </div>

      {/* Admin Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Registered Users" value={stats.totalUsers} icon={Users} color="amber" />
          <StatCard title="Total Articles" value={stats.totalArticles} icon={FileText} color="indigo" />
          <StatCard title="Published Articles" value={stats.publishedArticles} icon={CheckCircle} color="emerald" />
          <StatCard title="Soft Deleted" value={stats.deletedArticles} icon={Trash2} color="purple" />
        </div>
      )}

      {/* Users Management Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
          Registered Users ({users.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl object-cover" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
