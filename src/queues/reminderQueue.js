const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection configuration
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// Create the reminder queue
const reminderQueue = new Queue('reminders', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 3600, // Keep for 1 hour
    },
    removeOnFail: {
      count: 1000, // Keep last 1000 failed jobs
    },
  },
});

/**
 * Add a reminder job to the queue
 * @param {object} reminderData - Reminder data including reminderId, customerId, message, etc.
 * @param {Date} scheduledFor - When to process the reminder
 * @returns {Promise<Job>}
 */
async function scheduleReminder(reminderData, scheduledFor) {
  const delay = scheduledFor.getTime() - Date.now();
  
  if (delay < 0) {
    console.warn('Scheduled time is in the past, sending immediately');
  }

  const job = await reminderQueue.add('send-reminder', reminderData, {
    delay: Math.max(0, delay),
    jobId: reminderData.reminderId, // Use reminder ID as job ID to prevent duplicates
  });

  console.log(`Scheduled reminder job ${job.id} for ${scheduledFor.toISOString()}`);
  return job;
}

/**
 * Get queue metrics
 */
async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    reminderQueue.getWaitingCount(),
    reminderQueue.getActiveCount(),
    reminderQueue.getCompletedCount(),
    reminderQueue.getFailedCount(),
    reminderQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

/**
 * Clean old jobs from the queue
 */
async function cleanQueue(gracePeriodMs = 3600000) { // Default 1 hour
  await reminderQueue.clean(gracePeriodMs, 100, 'completed');
  await reminderQueue.clean(gracePeriodMs, 100, 'failed');
  console.log('Queue cleaned');
}

// Handle queue events
reminderQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

reminderQueue.on('waiting', (job) => {
  console.log(`Job ${job.id} is waiting`);
});

module.exports = {
  reminderQueue,
  scheduleReminder,
  getQueueMetrics,
  cleanQueue,
  connection,
};
