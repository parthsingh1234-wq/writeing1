// Client-side Article Storage & Synchronization Helper for 100% reliability
const LOCAL_STORAGE_KEY = 'vault_user_published_articles';
const DELETED_KEYS_STORAGE_KEY = 'vault_deleted_article_ids';

export const savePublishedArticleLocally = (article) => {
  if (!article) return;
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const getNormKey = (a) => (a._id || a.id || a.slug || a.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetKey = getNormKey(article);
    const filtered = existing.filter(a => getNormKey(a) !== targetKey);
    const updated = [article, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Remove from blacklist if user re-publishes
    const deletedList = JSON.parse(localStorage.getItem(DELETED_KEYS_STORAGE_KEY) || '[]');
    const keysToClean = [article._id, article.id, article.slug, article.title].filter(Boolean);
    const cleanDeleted = deletedList.filter(k => !keysToClean.includes(k));
    localStorage.setItem(DELETED_KEYS_STORAGE_KEY, JSON.stringify(cleanDeleted));
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

    // Save to permanent local blacklist so deleted items NEVER re-appear
    const deletedList = JSON.parse(localStorage.getItem(DELETED_KEYS_STORAGE_KEY) || '[]');
    if (!deletedList.includes(targetId)) {
      deletedList.push(targetId);
      localStorage.setItem(DELETED_KEYS_STORAGE_KEY, JSON.stringify(deletedList));
    }
  } catch (e) {
    console.warn('Could not remove article from local storage:', e.message);
  }
};

export const getMergedArticles = (serverArticles = []) => {
  try {
    const deletedList = JSON.parse(localStorage.getItem(DELETED_KEYS_STORAGE_KEY) || '[]');
    const isDeletedLocal = (a) => {
      if (!a) return true;
      const keys = [a._id, a.id, a.slug, a.title].filter(Boolean);
      return keys.some(k => deletedList.includes(k));
    };

    let list = Array.isArray(serverArticles) ? serverArticles : [];
    if (list.length === 0) {
      list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    }

    // Filter out blacklisted deleted articles and articles marked isDeleted
    const validList = list.filter(a => !isDeletedLocal(a) && !a.isDeleted);

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
