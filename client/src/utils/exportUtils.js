import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// HTML to Markdown converter
export const exportAsMarkdown = (article) => {
  let md = `# ${article.title}\n\n`;
  if (article.subtitle) md += `*${article.subtitle}*\n\n`;
  md += `**Author:** ${article.author?.name || 'Unknown'}\n`;
  md += `**Category:** ${article.category?.name || 'General'}\n`;
  md += `**Date:** ${new Date(article.createdAt).toLocaleDateString()}\n\n---\n\n`;

  // Convert basic HTML tags to MD
  let content = article.content || '';
  content = content.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
  content = content.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  content = content.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  content = content.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  content = content.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n');
  content = content.replace(/<[^>]+>/g, ''); // strip remaining tags

  md += content;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${article.slug || 'article'}.md`);
};

// Export as raw HTML
export const exportAsHTML = (article) => {
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${article.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #0f172a; }
    .subtitle { font-size: 1.25rem; color: #64748b; margin-bottom: 2rem; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 1rem; color: #475569; font-style: italic; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  ${article.subtitle ? `<div class="subtitle">${article.subtitle}</div>` : ''}
  <hr/>
  ${article.content}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${article.slug || 'article'}.html`);
};

// Export as DOCX
export const exportAsDOCX = async (article) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: article.title,
          heading: HeadingLevel.HEADING_1,
        }),
        ...(article.subtitle ? [
          new Paragraph({
            children: [
              new TextRun({
                text: article.subtitle,
                italics: true,
                color: '64748B',
                size: 24,
              }),
            ],
          })
        ] : []),
        new Paragraph({
          text: `Author: ${article.author?.name || 'Author'} | Category: ${article.category?.name || 'General'}`,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: article.rawText || article.content.replace(/<[^>]+>/g, ' '),
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${article.slug || 'article'}.docx`);
};

// Print / PDF layout trigger
export const printArticle = () => {
  window.print();
};
