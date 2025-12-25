const Stripe = require('stripe');

let stripeClient = null;

/**
 * Get Stripe client instance
 * Returns null if Stripe is not configured
 */
function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('Stripe not configured: STRIPE_SECRET_KEY not set. Stripe features will be disabled.');
    return null;
  }

  try {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    console.log('Stripe client initialized successfully');
    return stripeClient;
  } catch (error) {
    console.error('Failed to initialize Stripe client:', error.message);
    return null;
  }
}

/**
 * Check if Stripe is configured and available
 */
function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

module.exports = {
  getStripeClient,
  isStripeConfigured
};
