/**
 * Simple admin token middleware for protecting admin endpoints
 * Checks for x-admin-token header
 */
const adminMiddleware = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (!process.env.ADMIN_TOKEN) {
    console.error('ADMIN_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Invalid admin token' });
  }

  next();
};

module.exports = adminMiddleware;
