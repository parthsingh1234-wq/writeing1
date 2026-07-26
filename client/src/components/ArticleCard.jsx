import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Edit3, Trash2, Pin, CheckCircle, FileEdit, Archive, ShieldAlert, Check, X, User } from 'lucide-react';

export const ArticleCard = ({ article, onDelete, onRestore, onApprove, onReject, isAdmin = false, isTrash = false }) => {
  const statusBadges = {
    published: { text: 'Published', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    pending: { text: 'Pending Approval', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500 animate-pulse' },
    draft: { text: 'Draft', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
    archived: { text: 'Archived', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
  };

  const currentStatus = statusBadges[article.status] || statusBadges.draft;
  const authorName = typeof article.author === 'object' ? article.author?.name || 'Parth Singh' : 'Parth Singh';
  const authorAvatar = typeof article.author === 'object' ? article.author?.avatar : null;

  return (
    <article className="editorial-card group flex flex-col justify-between h-full bg-white dark:bg-[#121721] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      <div>
        {/* Aspect 16:9 Image Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center p-6 text-white text-center">
              <span className="font-serif font-bold text-lg text-slate-200 line-clamp-2">{article.title}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-200">
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
            <span>{currentStatus.text}</span>
          </div>

          {article.isPinned && (
            <div className="absolute top-3 right-3 p-1.5 rounded-full bg-red-700 text-white shadow-sm" title="Pinned Story">
              <Pin className="w-3 h-3 fill-current" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-2.5">
          {/* Category & Tags */}
          <div className="flex items-center gap-2">
            {article.category && (
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-700 dark:text-red-400">
                {article.category.name || article.category}
              </span>
            )}
          </div>

          {/* Article Title */}
          <Link to={isTrash ? '#' : `/article/${article.slug || article._id || article.id}`}>
            <h3 className="font-serif-headline text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
              {article.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {article.subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {article.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Footer Meta & Actions */}
      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2.5 min-w-0">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
              {authorName.charAt(0)}
            </div>
          )}
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]">{authorName}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[11px] shrink-0">{article.readingTime || 1} min read</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {article.status === 'pending' && isAdmin && onApprove && (
            <>
              <button
                onClick={() => onApprove(article._id || article.id)}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                title="Approve & Publish Article"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => onReject(article._id || article.id)}
                className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Reject to Draft"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          {isTrash ? (
            <>
              <button
                onClick={() => onRestore(article._id || article.id)}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => onDelete(article._id || article.id, true)}
                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to={`/editor/${article._id || article.id}`}
                className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-md transition-colors"
                title="Edit Story"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => onDelete(article._id || article.id)}
                className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                title="Move to Trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
