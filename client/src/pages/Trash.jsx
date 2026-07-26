import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { Trash2 } from 'lucide-react';

export const Trash = () => {
  const [deletedArticles, setDeletedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    try {
      const res = await API.get('/articles?isDeleted=true');
      if (res.success && res.articles) {
        setDeletedArticles(res.articles);
      }
    } catch (err) {
      console.error('Failed to load trash:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id) => {
    try {
      await API.put(`/articles/${id}/restore`);
      fetchDeleted();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('WARNING: Permanently deleting this article will erase all historical versions. Proceed?')) {
      try {
        await API.delete(`/articles/${id}/permanent`);
        fetchDeleted();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Recycle Bin</h1>
          <p className="text-xs text-slate-500">Restore accidentally deleted articles or permanently purge them</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading trash items...</div>
      ) : deletedArticles.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center">
          <Trash2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Recycle Bin is empty</h3>
          <p className="text-xs text-slate-400 mt-1">No soft-deleted articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedArticles.map((article) => (
            <ArticleCard
              key={article._id || article.id}
              article={article}
              isTrash={true}
              onRestore={handleRestore}
              onDelete={handlePermanentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
