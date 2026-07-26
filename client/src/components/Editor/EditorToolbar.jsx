import React, { useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Table, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter, Palette,
  Maximize2, Minimize2, Undo, Redo
} from 'lucide-react';

export const EditorToolbar = ({ editor, onImageUpload, isFullscreen, toggleFullscreen }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const textColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Sky', value: '#0284c7' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Light Gray', value: '#cbd5e1' },
    { name: 'Charcoal', value: '#334155' },
  ];

  const highlightColors = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Cyan', value: '#cffafe' },
    { name: 'Rose', value: '#fecdd3' },
  ];

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1.5 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-2xl">
      {/* Undo / Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-lg font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-lg font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded-lg font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Inline Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('bold') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('italic') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('underline') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('strike') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Text Color Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('textStyle') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Text Color"
        >
          <Palette className="w-4 h-4" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full mt-2 left-0 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-700 dark:text-slate-300">Text Color</span>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Reset Default
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {textColors.map(col => (
                <button
                  key={col.value}
                  type="button"
                  title={col.name}
                  className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 ring-1 ring-black/10 dark:ring-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: col.value }}
                  onClick={() => {
                    editor.chain().focus().setColor(col.value).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}

              {/* Custom Color Picker Button */}
              <label
                className="w-6 h-6 rounded-full border border-dashed border-slate-400 dark:border-slate-600 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                title="Custom Color"
              >
                +
                <input
                  type="color"
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                    setShowColorPicker(false);
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('highlight') ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Highlight Text"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-full mt-2 left-0 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 w-60 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-700 dark:text-slate-300">Highlight Color</span>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightPicker(false);
                }}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {highlightColors.map(col => (
                <button
                  key={col.value}
                  type="button"
                  title={col.name}
                  className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 ring-1 ring-black/10 dark:ring-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: col.value }}
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color: col.value }).run();
                    setShowHighlightPicker(false);
                  }}
                />
              ))}

              {/* Custom Highlight Input */}
              <label
                className="w-6 h-6 rounded-full border border-dashed border-slate-400 dark:border-slate-600 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                title="Custom Highlight"
              >
                +
                <input
                  type="color"
                  onChange={(e) => {
                    editor.chain().focus().setHighlight({ color: e.target.value }).run();
                    setShowHighlightPicker(false);
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Lists & Blocks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('orderedList') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('blockquote') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded-lg ${editor.isActive('codeBlock') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={insertTable}
        className={`p-1.5 rounded-lg ${editor.isActive('table') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Insert Table"
      >
        <Table className="w-4 h-4" />
      </button>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Hyperlink */}
      <button
        type="button"
        onClick={() => setShowLinkModal(true)}
        className={`p-1.5 rounded-lg ${editor.isActive('link') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Insert Hyperlink"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* Image Upload */}
      <button
        type="button"
        onClick={onImageUpload}
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Insert / Upload Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Writing Mode'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="absolute top-full mt-2 left-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex items-center gap-2 z-40">
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"
          />
          <button
            type="button"
            onClick={setLink}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
