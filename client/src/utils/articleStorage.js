// Client-side Article Storage & Synchronization Helper for 100% reliability
const LOCAL_STORAGE_KEY = 'vault_user_published_articles';

export const savePublishedArticleLocally = (article) => {
  if (!article) return;
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const getNormKey = (a) => (a._id || a.id || a.slug || a.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetKey = getNormKey(article);
    const filtered = existing.filter(a => getNormKey(a) !== targetKey);
    const updated = [article, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save article to local storage:', e.message);
  }
};

export const removePublishedArticleLocally = (targetId) => {
  if (!targetId) return;
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = existing.filter(a => (a._id !== targetId && a.id !== targetId && a.slug !== targetId));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not remove article from local storage:', e.message);
  }
};

export const getMergedArticles = (serverArticles = []) => {
  try {
    // If server articles are available, clear local stale items and use authoritative server list
    if (Array.isArray(serverArticles) && serverArticles.length > 0) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}

      return [...serverArticles].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const dateA = new Date(a.createdAt || a.updatedAt || Date.now());
        const dateB = new Date(b.createdAt || b.updatedAt || Date.now());
        return dateB - dateA;
      });
    }

    // Offline fallback
    const localSaved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    return Array.isArray(localSaved) ? localSaved : [];
  } catch (e) {
    return Array.isArray(serverArticles) ? serverArticles : [];
  }
};
