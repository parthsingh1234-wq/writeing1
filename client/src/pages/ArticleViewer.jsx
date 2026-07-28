import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { getMergedArticles } from '../utils/articleStorage';
import { useAuth } from '../context/AuthContext';
import { TOC } from '../components/TOC';
import { exportAsMarkdown, exportAsHTML, exportAsDOCX, printArticle } from '../utils/exportUtils';
import {
  Clock, Eye, Share2, Copy, Printer, Download, ArrowLeft,
  Calendar, Check, FileCode, FileText
} from 'lucide-react';

export const ArticleViewer = () => {
  const { idOrSlug } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const hasViewed = sessionStorage.getItem(`vault_viewed_${idOrSlug}`);
        const queryParam = !hasViewed ? '?incrementView=true' : '';
        const res = await API.get(`/articles/${idOrSlug}${queryParam}`);
        if (res && res.success && res.article) {
          setArticle(res.article);
          if (!hasViewed) {
            sessionStorage.setItem(`vault_viewed_${idOrSlug}`, 'true');
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend fetch for article failed, checking local store:', err.message);
      }

      // Local fallback for 100% stability
      const merged = getMergedArticles([]);
      const localArt = merged.find(a => a._id === idOrSlug || a.id === idOrSlug || a.slug === idOrSlug);
      if (localArt) {
        setArticle(localArt);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [idOrSlug]);

  // Scroll reading progress listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return <div className="p-16 text-center text-slate-400 text-sm">Loading article story...</div>;
  }

  if (!article) {
    return (
      <div className="glass-panel p-16 rounded-3xl text-center max-w-lg mx-auto my-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Article Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">The article story you requested does not exist or has been removed.</p>
        <Link to="/" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="relative pb-16">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-red-600 dark:bg-red-500 z-50 transition-all duration-150 shadow-sm"
        style={{ width: `${readingProgress}%` }}
      />

      {/* Navigation Top Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        {/* Action Controls & Exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={printArticle}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            title="Print or Export as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 rounded-xl text-xs font-bold shadow-sm">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover:block z-30">
              <button
                onClick={() => exportAsMarkdown(article)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-medium"
              >
                <FileCode className="w-3.5 h-3.5 text-red-600" />
                <span>Markdown (.md)</span>
              </button>
              <button
                onClick={() => exportAsHTML(article)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-medium"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-600" />
                <span>HTML File (.html)</span>
              </button>
              <button
                onClick={() => exportAsDOCX(article)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Word Doc (.docx)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="max-w-4xl mx-auto glass-panel p-8 sm:p-14 rounded-3xl space-y-8 shadow-sm">
        {/* Category & Title */}
        <header className="space-y-4">
          {article.category && (
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-700 dark:text-red-400">
              {article.category.name || article.category}
            </span>
          )}

          <h1 className="font-serif-headline text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-serif leading-relaxed">
              {article.subtitle}
            </p>
          )}

          {/* Author Badge & Date Info */}
          {(() => {
            const authorName = (article.author && typeof article.author === 'object' && article.author.name && !article.author.name.match(/^[a-f0-9]{24}$/i))
              ? article.author.name
              : (user?.name || 'Parth Singh');

            const authorAvatar = (article.author && typeof article.author === 'object' && article.author.avatar)
              ? article.author.avatar
              : (user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');

            return (
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
                />
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{authorName}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {article.readingTime || 1} min read
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {article.viewsCount || 1} views
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </header>

        {/* Cover Image Banner */}
        {article.coverImage && (
          <div className="rounded-3xl overflow-hidden shadow-xl max-h-[480px]">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Table of Contents */}
        <TOC htmlContent={article.content} />

        {/* Article Body Content */}
        <div
          className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 font-serif text-lg leading-relaxed space-y-6"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags List */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                #{tag.name || tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};
