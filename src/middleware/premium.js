const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware to check if a studio has premium access
 * Must be used after authMiddleware
 */
const premiumMiddleware = async (req, res, next) => {
  try {
    if (!req.studioId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const studio = await prisma.studio.findUnique({
      where: { id: req.studioId },
      select: { isPremium: true, premiumUntil: true }
    });

    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    // Check if premium and not expired
    if (!studio.isPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required',
        message: 'This feature requires a premium subscription'
      });
    }

    if (studio.premiumUntil && new Date(studio.premiumUntil) < new Date()) {
      return res.status(403).json({ 
        error: 'Premium subscription expired',
        message: 'Your premium subscription has expired. Please renew to continue using this feature.'
      });
    }

    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    return res.status(500).json({ error: 'Failed to verify premium status' });
  }
};

module.exports = premiumMiddleware;
