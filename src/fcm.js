const admin = require('firebase-admin');

let fcmInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Returns true if successfully initialized, false otherwise
 */
function initializeFirebase() {
  if (fcmInitialized) {
    return true;
  }

  try {
    // Check if service account path is provided
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      fcmInitialized = true;
      console.log('Firebase initialized with service account file');
      return true;
    }

    // Otherwise, check for individual env vars
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('Firebase not configured: Missing required environment variables. FCM features will be disabled.');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        clientEmail
      })
    });

    fcmInitialized = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    return false;
  }
}

/**
 * Send a push notification via FCM
 * @param {string} token - FCM device token
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload (optional)
 * @returns {Promise<string>} Message ID if successful
 */
async function sendPushNotification(token, notification, data = {}) {
  if (!fcmInitialized) {
    const initialized = initializeFirebase();
    if (!initialized) {
      throw new Error('Firebase is not configured');
    }
  }

  const message = {
    token,
    notification,
    data
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Check if Firebase/FCM is configured
 */
function isFCMConfigured() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    (process.env.FIREBASE_PROJECT_ID && 
     process.env.FIREBASE_PRIVATE_KEY && 
     process.env.FIREBASE_CLIENT_EMAIL)
  );
}

module.exports = {
  initializeFirebase,
  sendPushNotification,
  isFCMConfigured
};
