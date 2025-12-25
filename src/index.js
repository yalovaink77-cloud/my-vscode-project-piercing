require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('./middleware/auth');
const premiumMiddleware = require('./middleware/premium');
const adminMiddleware = require('./middleware/admin');
const { getStripeClient, isStripeConfigured } = require('./stripe');
const { sendPushNotification, isFCMConfigured, initializeFirebase } = require('./fcm');
const { scheduleReminder, getQueueMetrics } = require('./queues/reminderQueue');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json', limit: '5mb' })); // For Stripe webhooks

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    features: {
      stripe: isStripeConfigured(),
      fcm: isFCMConfigured(),
    }
  });
});

// ============================================================================
// Authentication Routes
// ============================================================================

/**
 * Register a new studio
 * POST /auth/register
 */
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if studio already exists
    const existing = await prisma.studio.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Studio with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create studio
    const studio = await prisma.studio.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { studioId: studio.id, email: studio.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ studio, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register studio' });
  }
});

/**
 * Login
 * POST /auth/login
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find studio
    const studio = await prisma.studio.findUnique({ where: { email } });
    if (!studio) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, studio.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { studioId: studio.id, email: studio.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      studio: {
        id: studio.id,
        email: studio.email,
        name: studio.name,
        isPremium: studio.isPremium,
      },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ============================================================================
// QR Code Routes (require authentication)
// ============================================================================

/**
 * Create a new QR code
 * POST /qr/create
 */
app.post('/qr/create', authMiddleware, async (req, res) => {
  try {
    const {
      customerId,
      code,
      piercingType,
      piercingLocation,
      jewelryType,
      jewelryMaterial,
      aftercareInstructions,
    } = req.body;

    if (!code || !piercingType || !aftercareInstructions) {
      return res.status(400).json({ 
        error: 'Code, piercing type, and aftercare instructions are required' 
      });
    }

    // Check if code already exists
    const existing = await prisma.qRCode.findUnique({ where: { code } });
    if (existing) {
      return res.status(409).json({ error: 'QR code already exists' });
    }

    // If customerId provided, verify it belongs to this studio
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, studioId: req.studioId },
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        studioId: req.studioId,
        customerId,
        code,
        piercingType,
        piercingLocation,
        jewelryType,
        jewelryMaterial,
        aftercareInstructions,
      },
    });

    res.status(201).json(qrCode);
  } catch (error) {
    console.error('Create QR code error:', error);
    res.status(500).json({ error: 'Failed to create QR code' });
  }
});

/**
 * Get QR code details
 * GET /qr/:id
 */
app.get('/qr/:id', authMiddleware, async (req, res) => {
  try {
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id: req.params.id,
        studioId: req.studioId,
      },
      include: {
        customer: true,
        reminders: true,
      },
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json(qrCode);
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

/**
 * List all QR codes for the authenticated studio
 * GET /qr
 */
app.get('/qr', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const qrCodes = await prisma.qRCode.findMany({
      where: { studioId: req.studioId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.qRCode.count({
      where: { studioId: req.studioId },
    });

    res.json({
      qrCodes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('List QR codes error:', error);
    res.status(500).json({ error: 'Failed to list QR codes' });
  }
});

// ============================================================================
// Customer Routes (require authentication)
// ============================================================================

/**
 * Create a new customer
 * POST /customers/create
 */
app.post('/customers/create', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        studioId: req.studioId,
        name,
        email,
        phone,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

/**
 * List customers
 * GET /customers
 */
app.get('/customers', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const customers = await prisma.customer.findMany({
      where: { studioId: req.studioId },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.customer.count({
      where: { studioId: req.studioId },
    });

    res.json({
      customers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: 'Failed to list customers' });
  }
});

// ============================================================================
// Stripe Routes (require authentication and premium)
// ============================================================================

/**
 * Create a Stripe checkout session
 * POST /stripe/create-checkout-session
 */
app.post('/stripe/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ 
        error: 'Stripe not configured',
        message: 'Payment processing is currently unavailable'
      });
    }

    const stripe = getStripeClient();
    const { priceId } = req.body;

    const sessionPriceId = priceId || process.env.STRIPE_PRICE_ID;
    if (!sessionPriceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get or create Stripe customer
    const studio = await prisma.studio.findUnique({
      where: { id: req.studioId },
    });

    let customerId = studio.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: studio.email,
        metadata: {
          studioId: studio.id,
        },
      });
      customerId = customer.id;

      // Save Stripe customer ID
      await prisma.studio.update({
        where: { id: req.studioId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: sessionPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/cancel`,
      metadata: {
        studioId: studio.id,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Stripe webhook handler
 * POST /stripe/webhook
 */
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const stripe = getStripeClient();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const studioId = session.metadata.studioId;

        if (studioId) {
          // Activate premium for the studio
          await prisma.studio.update({
            where: { id: studioId },
            data: {
              isPremium: true,
              premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
          });
          console.log(`Premium activated for studio ${studioId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find studio by Stripe customer ID and deactivate premium
        const studio = await prisma.studio.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (studio) {
          await prisma.studio.update({
            where: { id: studio.id },
            data: {
              isPremium: false,
              premiumUntil: null,
            },
          });
          console.log(`Premium deactivated for studio ${studio.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ============================================================================
// FCM Routes (require authentication)
// ============================================================================

/**
 * Register FCM device token for a customer
 * POST /fcm/register-token
 */
app.post('/fcm/register-token', authMiddleware, async (req, res) => {
  try {
    const { customerId, token } = req.body;

    if (!customerId || !token) {
      return res.status(400).json({ error: 'Customer ID and token are required' });
    }

    // Verify customer belongs to this studio
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, studioId: req.studioId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update customer with FCM token
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { fcmToken: token },
    });

    res.json({ success: true, customer: updated });
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

/**
 * Send a test push notification
 * POST /fcm/send
 */
app.post('/fcm/send', authMiddleware, async (req, res) => {
  try {
    if (!isFCMConfigured()) {
      return res.status(503).json({ 
        error: 'FCM not configured',
        message: 'Push notifications are currently unavailable'
      });
    }

    const { customerId, title, body } = req.body;

    if (!customerId || !title || !body) {
      return res.status(400).json({ error: 'Customer ID, title, and body are required' });
    }

    // Get customer
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, studioId: req.studioId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (!customer.fcmToken) {
      return res.status(400).json({ error: 'Customer has no FCM token registered' });
    }

    // Send notification
    const messageId = await sendPushNotification(
      customer.fcmToken,
      { title, body }
    );

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Send FCM notification error:', error);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

// ============================================================================
// Reminder Routes (require authentication)
// ============================================================================

/**
 * Schedule a reminder
 * POST /reminders/schedule
 */
app.post('/reminders/schedule', authMiddleware, async (req, res) => {
  try {
    const { customerId, qrCodeId, message, scheduledFor } = req.body;

    if (!customerId || !qrCodeId || !message || !scheduledFor) {
      return res.status(400).json({ 
        error: 'Customer ID, QR code ID, message, and scheduled time are required' 
      });
    }

    // Verify customer and QR code belong to this studio
    const [customer, qrCode] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: customerId, studioId: req.studioId },
      }),
      prisma.qRCode.findFirst({
        where: { id: qrCodeId, studioId: req.studioId },
      }),
    ]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Create reminder in database
    const reminder = await prisma.scheduledReminder.create({
      data: {
        studioId: req.studioId,
        customerId,
        qrCodeId,
        message,
        scheduledFor: new Date(scheduledFor),
      },
    });

    // Add to queue
    await scheduleReminder(
      {
        reminderId: reminder.id,
        customerId,
        message,
      },
      new Date(scheduledFor)
    );

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Schedule reminder error:', error);
    res.status(500).json({ error: 'Failed to schedule reminder' });
  }
});

/**
 * List reminders
 * GET /reminders
 */
app.get('/reminders', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    const where = { studioId: req.studioId };
    if (status) {
      where.status = status;
    }

    const reminders = await prisma.scheduledReminder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        qrCode: {
          select: {
            id: true,
            code: true,
            piercingType: true,
          },
        },
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { scheduledFor: 'desc' },
    });

    const total = await prisma.scheduledReminder.count({ where });

    res.json({
      reminders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('List reminders error:', error);
    res.status(500).json({ error: 'Failed to list reminders' });
  }
});

// ============================================================================
// Admin Routes (require admin token)
// ============================================================================

/**
 * Get queue metrics
 * GET /admin/queue-metrics
 */
app.get('/admin/queue-metrics', adminMiddleware, async (req, res) => {
  try {
    const metrics = await getQueueMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Get queue metrics error:', error);
    res.status(500).json({ error: 'Failed to get queue metrics' });
  }
});

/**
 * List failed jobs
 * GET /admin/failed-jobs
 */
app.get('/admin/failed-jobs', adminMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const failedJobs = await prisma.failedJob.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { failedAt: 'desc' },
    });

    const total = await prisma.failedJob.count({ where });

    res.json({
      failedJobs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('List failed jobs error:', error);
    res.status(500).json({ error: 'Failed to list failed jobs' });
  }
});

/**
 * Retry a failed job
 * POST /admin/failed-jobs/:id/retry
 */
app.post('/admin/failed-jobs/:id/retry', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const failedJob = await prisma.failedJob.findUnique({
      where: { id },
    });

    if (!failedJob) {
      return res.status(404).json({ error: 'Failed job not found' });
    }

    if (failedJob.status === 'resolved') {
      return res.status(400).json({ error: 'Job already resolved' });
    }

    // Parse job data and re-schedule
    const jobData = JSON.parse(failedJob.jobData);

    if (failedJob.jobType === 'reminder') {
      // Get the reminder to check its current status
      const reminder = await prisma.scheduledReminder.findUnique({
        where: { id: jobData.reminderId },
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Associated reminder not found' });
      }

      // Reset reminder status
      await prisma.scheduledReminder.update({
        where: { id: jobData.reminderId },
        data: {
          status: 'pending',
          error: null,
        },
      });

      // Re-schedule immediately
      await scheduleReminder(jobData, new Date());

      // Update failed job
      await prisma.failedJob.update({
        where: { id },
        data: {
          status: 'retrying',
          retriedAt: new Date(),
        },
      });

      res.json({ success: true, message: 'Job re-scheduled for immediate processing' });
    } else {
      res.status(400).json({ error: 'Unsupported job type for retry' });
    }
  } catch (error) {
    console.error('Retry failed job error:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

/**
 * Delete a failed job
 * DELETE /admin/failed-jobs/:id
 */
app.delete('/admin/failed-jobs/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.failedJob.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Failed job not found' });
    }
    console.error('Delete failed job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ============================================================================
// Server Startup
// ============================================================================

// Initialize Firebase if configured
if (isFCMConfigured()) {
  initializeFirebase();
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Features enabled:`);
  console.log(`  - Stripe: ${isStripeConfigured() ? 'Yes' : 'No (set STRIPE_SECRET_KEY to enable)'}`);
  console.log(`  - FCM: ${isFCMConfigured() ? 'Yes' : 'No (set Firebase env vars to enable)'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
