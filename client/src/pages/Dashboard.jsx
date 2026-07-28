import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getMergedArticles } from '../utils/articleStorage';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { ArticleCard } from '../components/ArticleCard';
import {
  FileText, Edit3, CheckCircle2, Image as ImageIcon,
  PenSquare, FolderTree, ArrowRight, Sparkles, ShieldAlert, Check, X
} from 'lucide-react';

export const Dashboard = ({ searchTerm }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalArticles: 0,
    draftsCount: 0,
    publishedCount: 0,
    totalImages: 0,
    recentArticles: []
  });
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, articlesRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/articles')
      ]);

      const serverArts = (articlesRes && articlesRes.success) ? articlesRes.articles : [];
      const mergedArts = getMergedArticles(serverArts);

      if (statsRes && statsRes.success) {
        setStats({
          ...statsRes.stats,
          totalArticles: Math.max(statsRes.stats.totalArticles || 0, mergedArts.length),
          publishedArticles: Math.max(statsRes.stats.publishedArticles || 0, mergedArts.filter(a => a.status === 'published').length)
        });
      }
      setAllArticles(mergedArts);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err.message);
      setAllArticles(getMergedArticles([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteArticle = async (id) => {
    if (window.confirm('Are you sure you want to move this article to the Recycle Bin?')) {
      try {
        await API.delete(`/articles/${id}`);
        fetchDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleApproveArticle = async (id) => {
    try {
      const res = await API.put(`/articles/${id}/approve`);
      if (res.message) alert(res.message);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to approve article:', err.message);
    }
  };

  const handleRejectArticle = async (id) => {
    try {
      const res = await API.put(`/articles/${id}/reject`);
      if (res.message) alert(res.message);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to reject article:', err.message);
    }
  };

  const pendingArticles = allArticles.filter(a => a.status === 'pending');

  const filteredArticles = allArticles.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.title?.toLowerCase().includes(term) ||
      a.subtitle?.toLowerCase().includes(term) ||
      a.rawText?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-slate-900 dark:bg-[#121721] text-white border border-slate-800 shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold tracking-widest uppercase mb-3 border border-white/10 text-slate-300">
            <Sparkles className="w-3 h-3 text-red-400" />
            <span>Article Vault • Editorial CMS</span>
          </div>
          <h1 className="font-serif-headline text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            The Editorial Desk & Newsroom
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Draft, review, optimize images, track revisions, and publish stories across your organization's digital publications.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/editor/new"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>Write New Story</span>
            </Link>
            <Link
              to="/images"
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs rounded-xl border border-white/10 transition-all flex items-center gap-2"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media Assets</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Pending Approvals Queue Banner */}
      {isAdmin && pendingArticles.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border-2 border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Pending Admin Approvals ({pendingArticles.length})
                </h2>
                <p className="text-xs text-slate-500">
                  User articles submitted for your approval before publishing live
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingArticles.map((article) => (
              <ArticleCard
                key={article._id || article.id}
                article={article}
                onDelete={handleDeleteArticle}
                onApprove={handleApproveArticle}
                onReject={handleRejectArticle}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Articles"
          value={stats.totalArticles}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Drafts"
          value={stats.draftsCount}
          icon={Edit3}
          color="amber"
        />
        <StatCard
          title="Published"
          value={stats.publishedCount}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Images"
          value={stats.totalImages}
          icon={ImageIcon}
          color="purple"
        />
      </div>

      {/* Articles Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Recent Articles'}
          </h2>
          <Link
            to="/articles"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No articles found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Start writing your first article now!</p>
            <Link
              to="/editor/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-md"
            >
              <PenSquare className="w-4 h-4" />
              <span>Write Article</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article._id || article.id}
                article={article}
                onDelete={handleDeleteArticle}
                onApprove={handleApproveArticle}
                onReject={handleRejectArticle}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
