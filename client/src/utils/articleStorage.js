// Client-side Article Storage & Synchronization Helper for 100% reliability
const LOCAL_STORAGE_KEY = 'vault_user_published_articles';

export const savePublishedArticleLocally = (article) => {
  if (!article) return;
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const key = article._id || article.id || article.slug;
    const filtered = existing.filter(a => (a._id || a.id || a.slug) !== key);
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
    const localSaved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const map = new Map();

    // Insert server articles
    if (Array.isArray(serverArticles)) {
      serverArticles.forEach(a => {
        const key = a._id || a.id || a.slug;
        if (key) map.set(key, a);
      });
    }

    // Insert local saved articles if missing from server response
    if (Array.isArray(localSaved)) {
      localSaved.forEach(a => {
        const key = a._id || a.id || a.slug;
        if (key && !map.has(key)) {
          map.set(key, a);
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || Date.now());
      const dateB = new Date(b.createdAt || b.updatedAt || Date.now());
      return dateB - dateA;
    });
  } catch (e) {
    return Array.isArray(serverArticles) ? serverArticles : [];
  }
};
