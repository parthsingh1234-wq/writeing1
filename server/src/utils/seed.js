const dotenv = require('dotenv');
dotenv.config();
const { connectDB } = require('../config/db');
const dbAdapter = require('../models/dataStoreAdapter');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Seeding Article Vault initial data...');

    // 1. Seed Admin & Regular User
    let admin = await dbAdapter.findUserByEmail('parthsinghchauhan1234@gmail.com');
    if (!admin) {
      admin = await dbAdapter.createUser({
        name: 'Parth Singh',
        email: 'parthsinghchauhan1234@gmail.com',
        password: 'admin123Password!',
        role: 'admin',
        bio: 'Platform Administrator & Chief Editor.'
      });
      console.log('Created Admin User: parthsinghchauhan1234@gmail.com');
    }

    let user = await dbAdapter.findUserByEmail('user@articlevault.com');
    if (!user) {
      user = await dbAdapter.createUser({
        name: 'Sarah Connor',
        email: 'user@articlevault.com',
        password: 'user123Password!',
        role: 'user',
        bio: 'Tech enthusiast and AI researcher.'
      });
      console.log('Created Demo User: user@articlevault.com');
    }

    const adminId = admin._id || admin.id;
    const userId = user._id || user.id;

    // 2. Seed Default Categories
    const categoriesData = [
      { name: 'Technology', description: 'Computing, software engineering, and digital systems.', color: '#3b82f6', icon: 'Cpu' },
      { name: 'AI & Machine Learning', description: 'LLMs, Neural Networks, and Generative Intelligence.', color: '#8b5cf6', icon: 'Bot' },
      { name: 'Science', description: 'Space, physics, biology, and frontier discoveries.', color: '#10b981', icon: 'Atom' },
      { name: 'Economy & Finance', description: 'Global markets, macroeconomic trends, and startups.', color: '#f59e0b', icon: 'TrendingUp' },
      { name: 'History', description: 'Historical analysis, ancient origins, and perspectives.', color: '#ef4444', icon: 'BookOpen' },
      { name: 'Personal', description: 'Thoughts, essays, and personal reflections.', color: '#ec4899', icon: 'User' }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const existing = (await dbAdapter.getCategories()).find(c => c.name === cat.name);
      if (!existing) {
        const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const created = await dbAdapter.createCategory({ ...cat, slug, createdBy: adminId });
        categoryMap[cat.name] = created._id || created.id;
      } else {
        categoryMap[cat.name] = existing._id || existing.id;
      }
    }

    // 3. Seed Default Tags
    const tagsData = [
      { name: 'AI', color: '#8b5cf6' },
      { name: 'Web Dev', color: '#0284c7' },
      { name: 'Future', color: '#059669' },
      { name: 'Design', color: '#d97706' },
      { name: 'Tutorial', color: '#7c3aed' }
    ];

    const tagMap = {};
    for (const tag of tagsData) {
      const existing = (await dbAdapter.getTags()).find(t => t.name === tag.name);
      if (!existing) {
        const slug = tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const created = await dbAdapter.createTag({ ...tag, slug, createdBy: adminId });
        tagMap[tag.name] = created._id || created.id;
      } else {
        tagMap[tag.name] = existing._id || existing.id;
      }
    }

    // 4. Seed Initial Articles
    const existingArticles = await dbAdapter.findArticles();
    if (existingArticles.length === 0) {
      await dbAdapter.createArticle({
        title: 'The Future of Agentic AI Systems in Modern Software',
        subtitle: 'How autonomous agents are transforming full-stack development and developer productivity.',
        slug: 'future-of-agentic-ai-systems-2026',
        content: `
          <h1>The Future of Agentic AI Systems</h1>
          <p>Autonomous AI agents are shifting from passive chat assistants to proactive, context-aware pair programmers capable of orchestrating multi-step architectural deployments.</p>
          <h2>Key Breakthroughs in 2026</h2>
          <ul>
            <li><strong>Deterministic Tool Calling:</strong> Precise execution of file operations and API orchestrations.</li>
            <li><strong>Contextual Knowledge Bases:</strong> Localized indexing that preserves design system rules.</li>
            <li><strong>Offline Synchronization:</strong> Local draft caching with back-end reconciliation upon connection.</li>
          </ul>
          <blockquote>"The best code is written when human creative intent seamlessly blends with high-speed AI execution."</blockquote>
        `,
        rawText: 'The Future of Agentic AI Systems... Autonomous AI agents are shifting from passive chat assistants...',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
        author: adminId,
        category: categoryMap['AI & Machine Learning'],
        tags: [tagMap['AI'], tagMap['Future']],
        status: 'published',
        isPinned: true,
        readingTime: 3,
        wordCount: 350,
        characterCount: 2200,
        viewsCount: 142
      });

      await dbAdapter.createArticle({
        title: 'Designing High-Performance React Apps with Vite & Tailwind CSS',
        subtitle: 'Best practices for modular UI design, glassmorphic themes, and rapid prototyping.',
        slug: 'designing-high-performance-react-apps-2026',
        content: `
          <h1>Designing High-Performance React Apps</h1>
          <p>Modern frontend engineering requires a fine balance between clean aesthetic styling and minimal client-side runtime overhead.</p>
          <h3>Why Tailwind CSS + Vite?</h3>
          <p>Vite provides instant HMR while Tailwind's utility-first paradigm enables rapid iteration without stylesheet bloat.</p>
        `,
        rawText: 'Designing High-Performance React Apps... Modern frontend engineering requires a fine balance...',
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
        author: userId,
        category: categoryMap['Technology'],
        tags: [tagMap['Web Dev'], tagMap['Design']],
        status: 'published',
        isPinned: false,
        readingTime: 2,
        wordCount: 240,
        characterCount: 1500,
        viewsCount: 89
      });

      await dbAdapter.createArticle({
        title: 'Draft: Modern Content Security Strategies',
        subtitle: 'Sanitizing dynamic rich-text HTML and guarding against XSS vulnerabilities.',
        slug: 'draft-modern-content-security-strategies-2026',
        content: `
          <h1>Draft: Content Security</h1>
          <p>Always sanitize user input using DOMPurify on the client and sanitize-html on the Express API server.</p>
        `,
        rawText: 'Draft: Content Security... Always sanitize user input using DOMPurify...',
        coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
        author: userId,
        category: categoryMap['Technology'],
        tags: [tagMap['Tutorial']],
        status: 'draft',
        isPinned: false,
        readingTime: 1,
        wordCount: 110,
        characterCount: 750,
        viewsCount: 0
      });

      console.log('Seeded 3 demo articles successfully.');
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

if (require.main === module) {
  seedData().then(() => process.exit());
}

module.exports = seedData;
