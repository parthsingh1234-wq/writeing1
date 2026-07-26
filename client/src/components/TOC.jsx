import React, { useEffect, useState } from 'react';
import { List } from 'lucide-react';

export const TOC = ({ htmlContent }) => {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!htmlContent) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const nodes = doc.querySelectorAll('h1, h2, h3');

    const parsedHeadings = Array.from(nodes).map((node, index) => {
      const text = node.textContent || '';
      const id = node.id || `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      return {
        id,
        text,
        level: parseInt(node.tagName.replace('H', ''), 10)
      };
    });

    setHeadings(parsedHeadings);
  }, [htmlContent]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl mb-6">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        <List className="w-4 h-4 text-indigo-500" />
        <span>Table of Contents</span>
      </div>
      <ul className="space-y-2 text-sm">
        {headings.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
          >
            <button
              onClick={() => scrollToHeading(item.id)}
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-left line-clamp-1 transition-colors"
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
