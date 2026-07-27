const app = require('../server/src/app');

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Vercel Serverless Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Serverless Invocation Failure'
    });
  }
};
