require('dotenv').config();
const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { sendPushNotification, isFCMConfigured } = require('../fcm');
const { connection } = require('../queues/reminderQueue');

const prisma = new PrismaClient();

/**
 * Process a reminder job
 * @param {Job} job - BullMQ job object
 */
async function processReminder(job) {
  const { reminderId, customerId, message } = job.data;

  console.log(`Processing reminder ${reminderId} for customer ${customerId}`);

  try {
    // Get reminder and customer details
    const reminder = await prisma.scheduledReminder.findUnique({
      where: { id: reminderId },
      include: {
        customer: true,
        qrCode: true,
      },
    });

    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }

    if (reminder.status === 'sent') {
      console.log(`Reminder ${reminderId} already sent, skipping`);
      return { success: true, alreadySent: true };
    }

    // Update attempt count
    await prisma.scheduledReminder.update({
      where: { id: reminderId },
      data: {
        attempts: reminder.attempts + 1,
        lastAttempt: new Date(),
      },
    });

    // Send push notification if FCM is configured and customer has token
    if (isFCMConfigured() && reminder.customer.fcmToken) {
      try {
        await sendPushNotification(
          reminder.customer.fcmToken,
          {
            title: 'Piercing Aftercare Reminder',
            body: message,
          },
          {
            reminderId,
            qrCodeId: reminder.qrCodeId,
          }
        );

        // Mark as sent
        await prisma.scheduledReminder.update({
          where: { id: reminderId },
          data: {
            status: 'sent',
            sentAt: new Date(),
            error: null,
          },
        });

        console.log(`Successfully sent reminder ${reminderId}`);
        return { success: true };
      } catch (fcmError) {
        console.error(`FCM error for reminder ${reminderId}:`, fcmError.message);
        throw fcmError;
      }
    } else {
      // FCM not configured or no token - log and mark as sent anyway
      console.warn(`FCM not configured or customer has no token for reminder ${reminderId}`);
      
      await prisma.scheduledReminder.update({
        where: { id: reminderId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          error: 'FCM not configured or no customer token',
        },
      });

      return { success: true, noFCM: true };
    }
  } catch (error) {
    console.error(`Error processing reminder ${reminderId}:`, error);

    // Update reminder with error
    await prisma.scheduledReminder.update({
      where: { id: reminderId },
      data: {
        status: 'failed',
        error: error.message,
      },
    });

    // Log to failed jobs table if this is the final attempt
    if (job.attemptsMade >= job.opts.attempts - 1) {
      await prisma.failedJob.create({
        data: {
          jobType: 'reminder',
          jobData: JSON.stringify(job.data),
          error: error.message,
          stackTrace: error.stack,
          attempts: job.attemptsMade + 1,
        },
      });
      console.log(`Logged reminder ${reminderId} to failed jobs table`);
    }

    throw error; // Re-throw to let BullMQ handle retry
  }
}

// Create the worker
const worker = new Worker('reminders', processReminder, {
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second
  },
});

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

worker.on('ready', () => {
  console.log('Reminder worker is ready and waiting for jobs');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('Reminder worker started');
