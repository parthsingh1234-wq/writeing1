import React, { useState, useEffect } from 'react';
import { History, RotateCcw, X, Clock, CheckCircle2 } from 'lucide-react';
import API from '../services/api';

export const VersionHistoryModal = ({ articleId, isOpen, onClose, onRestoreSuccess }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!isOpen || !articleId) return;

    const fetchVersions = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/articles/${articleId}/versions`);
        if (res.success && res.versions) {
          setVersions(res.versions);
          if (res.versions.length > 0) {
            setSelectedVersion(res.versions[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [isOpen, articleId]);

  if (!isOpen) return null;

  const handleRestore = async (versionId) => {
    setRestoring(true);
    try {
      const res = await API.post(`/articles/${articleId}/versions/${versionId}/restore`);
      if (res.success) {
        onRestoreSuccess(res.article);
        onClose();
      }
    } catch (err) {
      console.error('Failed to restore version:', err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Version History</h3>
              <p className="text-xs text-slate-500">Review past article snapshots and restore any version.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Timeline Panel */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">Loading timeline...</div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No historical versions recorded yet.</div>
            ) : (
              versions.map((ver) => (
                <button
                  key={ver._id || ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    selectedVersion?._id === ver._id || selectedVersion?.id === ver.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Version {ver.versionNumber}</span>
                    <span className="text-[10px] opacity-75">{new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs mt-1 line-clamp-1 opacity-90">{ver.title}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] opacity-75">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right Preview Panel */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
            {selectedVersion ? (
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      Version {selectedVersion.versionNumber} Snapshot
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{selectedVersion.title}</h4>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion._id || selectedVersion.id)}
                    disabled={restoring}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{restoring ? 'Restoring...' : 'Restore This Version'}</span>
                  </button>
                </div>

                <div
                  className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                />
              </div>
            ) : (
              <div className="m-auto text-slate-400 text-sm">Select a version from the timeline to preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
