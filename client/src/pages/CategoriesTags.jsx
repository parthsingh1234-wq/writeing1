import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { FolderTree, Plus, Tag as TagIcon, Folder, Hash } from 'lucide-react';

export const CategoriesTags = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');

  // New Tag Form
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');

  const fetchData = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        API.get('/categories'),
        API.get('/tags')
      ]);
      if (catRes.success) setCategories(catRes.categories);
      if (tagRes.success) setTags(tagRes.tags);
    } catch (err) {
      console.error('Failed to load categories/tags:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await API.post('/categories', { name: catName, description: catDesc, color: catColor });
      setCatName('');
      setCatDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
      await API.post('/tags', { name: tagName, color: tagColor });
      setTagName('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
          <FolderTree className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Categories & Tags Manager</h1>
          <p className="text-xs text-slate-500">Organize and classify article content for rapid discovery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Folder className="w-5 h-5 text-indigo-500" />
            <span>Categories</span>
          </h2>

          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="New Category Name..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              />
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
              />
            </div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {categories.map((c) => (
              <div
                key={c._id || c.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} />
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{c.name}</p>
                    {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Hash className="w-5 h-5 text-blue-500" />
            <span>Tags</span>
          </h2>

          <form onSubmit={handleCreateTag} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="New Tag Name..."
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
            />
            <input
              type="color"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto">
            {tags.map((t) => (
              <span
                key={t._id || t.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || '#3b82f6' }} />
                <span>#{t.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
