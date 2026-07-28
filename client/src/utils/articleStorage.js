// Client-side Article Storage & Synchronization Helper for 100% reliability
const LOCAL_STORAGE_KEY = 'vault_user_published_articles';
const DELETED_KEYS_STORAGE_KEY = 'vault_deleted_article_ids';

const getNormKey = (a) => {
  if (!a) return '';
  if (typeof a === 'string') return a.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (a.slug || a.title || a._id || a.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const savePublishedArticleLocally = (article) => {
  if (!article) return;
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const targetKey = getNormKey(article);
    const filtered = existing.filter(a => getNormKey(a) !== targetKey);
    const updated = [article, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Remove from blacklist if user re-publishes
    const deletedList = JSON.parse(localStorage.getItem(DELETED_KEYS_STORAGE_KEY) || '[]');
    const keysToClean = [article._id, article.id, article.slug, article.title, targetKey].filter(Boolean);
    const cleanDeleted = deletedList.filter(k => !keysToClean.includes(k));
    localStorage.setItem(DELETED_KEYS_STORAGE_KEY, JSON.stringify(cleanDeleted));
  } catch (e) {
    console.warn('Could not save article to local storage:', e.message);
  }
};

export const removePublishedArticleLocally = (target) => {
  if (!target) return;
  try {
    const targetKey = getNormKey(target);
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = existing.filter(a => getNormKey(a) !== targetKey);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Save to permanent local blacklist so deleted items NEVER re-appear
    const deletedList = JSON.parse(localStorage.getItem(DELETED_KEYS_STORAGE_KEY) || '[]');
    const idVal = typeof target === 'object' ? (target._id || target.id || target.slug) : target;
    const titleVal = typeof target === 'object' ? target.title : null;
    
    [idVal, targetKey, titleVal].forEach(k => {
      if (k && !deletedList.includes(k)) {
        deletedList.push(k);
      }
    });
    localStorage.setItem(DELETED_KEYS_STORAGE_KEY, JSON.stringify(deletedList));
  } catch (e) {
    console.warn('Could not remove article from local storage:', e.message);
  }
};

export const getMergedArticles = (serverArticles = []) => {
  try {
    const deletedList = JSON.parse(localStorage.getItem(DELETED_KEYS_STORAGE_KEY) || '[]');
    const isDeletedLocal = (a) => {
      if (!a) return true;
      const keys = [a._id, a.id, a.slug, a.title, getNormKey(a)].filter(Boolean);
      return keys.some(k => deletedList.includes(k));
    };

    let list = Array.isArray(serverArticles) ? serverArticles : [];
    if (list.length === 0) {
      list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    }

    // Always filter out blacklisted deleted articles
    const validList = list.filter(a => !a.isDeleted && !isDeletedLocal(a));

    return validList.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = new Date(a.createdAt || a.updatedAt || Date.now());
      const dateB = new Date(b.createdAt || b.updatedAt || Date.now());
      return dateB - dateA;
    });
  } catch (e) {
    return Array.isArray(serverArticles) ? serverArticles : [];
  }
};
