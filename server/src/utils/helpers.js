const sanitizeHtml = require('sanitize-html');

// HTML sanitization options for TipTap output
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 's', 'strike',
    'sub', 'sup', 'mark', 'span', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['style', 'class', 'id', 'data-*'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
    'a': ['href', 'name', 'target', 'rel'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan']
  },
  allowedSchemes: ['http', 'https', 'data']
};

const cleanHtml = (html) => {
  if (!html) return '';
  return sanitizeHtml(html, sanitizeOptions);
};

const calculateReadingTime = (text) => {
  if (!text) return 1;
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes > 0 ? minutes : 1;
};

const generateSlug = (title) => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${baseSlug}-${randomSuffix}`;
};

module.exports = {
  cleanHtml,
  calculateReadingTime,
  generateSlug
};
