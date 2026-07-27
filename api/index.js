module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vercel Serverless API Function is live!",
    timestamp: new Date().toISOString()
  });
};
