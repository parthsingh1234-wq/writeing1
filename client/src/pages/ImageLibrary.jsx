import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Image as ImageIcon, Trash2, Copy, Check, Search, Upload } from 'lucide-react';

export const ImageLibrary = () => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await API.get('/images');
      if (res.success && res.images) {
        setImages(res.images);
      }
    } catch (err) {
      console.error('Failed to load image library:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleDeleteImage = async (id) => {
    if (window.confirm('Are you sure you want to delete this image asset?')) {
      try {
        await API.delete(`/images/${id}`);
        fetchImages();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('images', file);
      }
      await API.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchImages();
    } catch (err) {
      console.error('Failed to upload image:', err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredImages = images.filter(img =>
    !img.isAvatar &&
    img.url !== user?.avatar &&
    (img.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     img.url?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Upload Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Image Asset Library</h1>
            <p className="text-xs text-slate-500">Manage uploaded images, copy links, and inspect assets</p>
          </div>
        </div>

        <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading Assets...' : 'Upload New Images'}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search images by name or URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
        />
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading image library...</div>
      ) : filteredImages.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No image assets found</h3>
          <p className="text-xs text-slate-400 mt-1">Upload images to use them inside your articles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((img) => {
            const imgId = img._id || img.id;
            const isCopied = copiedId === imgId;
            return (
              <div key={imgId} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group">
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopyUrl(img.url, imgId)}
                      className="p-2 bg-white text-slate-900 rounded-xl text-xs font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{img.originalName || 'Asset'}</p>
                    <p className="text-[10px] text-slate-400">{(img.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => handleDeleteImage(imgId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete Image Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
