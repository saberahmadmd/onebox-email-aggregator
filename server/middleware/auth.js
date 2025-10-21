const authenticate = (req, res, next) => {
  // For development, allow all requests
  // In production, implement proper authentication
  next();
};

const requireAuth = (req, res, next) => {
  // Basic API key authentication
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAuth
};