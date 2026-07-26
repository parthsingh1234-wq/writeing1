import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import API from '../../services/api';

export const TipTapEditor = ({
  content,
  onChange,
  onStatsChange,
  onImageUploadTrigger,
  isFullscreen,
  toggleFullscreen
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Write your story here... Use headings, images, and formatting to bring your article to life.',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = editor.storage.characterCount.words();
      const characters = editor.storage.characterCount.characters();

      onChange(html);
      if (onStatsChange) {
        onStatsChange({
          words,
          characters,
          readingTime: Math.ceil(words / 200) || 1,
        });
      }
    },
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            uploadAndInsertImage(file, editor);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (file) {
              uploadAndInsertImage(file, editor);
              return true;
            }
          }
        }
        return false;
      }
    }
  });

  const uploadAndInsertImage = async (file, ed) => {
    try {
      const formData = new FormData();
      formData.append('images', file);

      const res = await API.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success && res.url) {
        ed.chain().focus().setImage({ src: res.url, alt: file.name }).run();
      }
    } catch (err) {
      console.error('Failed to paste/drop upload image:', err.message);
    }
  };

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div className={`flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all duration-200 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''}`}>
      <EditorToolbar
        editor={editor}
        onImageUpload={onImageUploadTrigger}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
