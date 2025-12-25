# Piercing QR Premium Module - Project Overview

## Summary

This document provides a comprehensive overview of the Piercing QR premium module implementation. This is a complete, standalone demo that can be integrated into the mobile app later.

## What Was Built

A full-stack application consisting of:
- **Backend**: Node.js + Express API server
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: BullMQ with Redis for background jobs
- **Payments**: Stripe integration for premium subscriptions
- **Notifications**: Firebase Cloud Messaging (FCM) for push notifications
- **Admin UI**: React + Vite dashboard for managing failed jobs

## Key Features

### 1. Authentication & Authorization
- JWT-based authentication for studio accounts
- Premium subscription checking middleware
- Admin token authentication for management endpoints

### 2. QR Code Management
- Create QR codes for individual piercings
- Store aftercare instructions
- Link QR codes to customers
- Track jewelry type and material

### 3. Customer Management
- Customer profiles with contact information
- FCM token registration for push notifications
- Link customers to multiple piercings

### 4. Premium Subscriptions (Stripe)
- Checkout session creation
- Webhook handling for subscription events
- Automatic premium activation/deactivation
- Gracefully disabled when Stripe not configured

### 5. Push Notifications (FCM)
- Send aftercare reminders
- Device token management
- Gracefully disabled when Firebase not configured

### 6. Reminder Queue System
- BullMQ-based job queue
- Scheduled reminder processing
- Automatic retry with exponential backoff
- Dead Letter Queue (DLQ) for failed jobs

### 7. Admin Dashboard
- View failed jobs
- Retry failed jobs
- Delete failed jobs
- View queue metrics (waiting, active, completed, failed, delayed)
- Real-time updates every 30 seconds

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client/Admin UI                         │
│                    (React + Vite App)                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                         │
│  - Auth Routes (register, login)                            │
│  - QR Code Routes (create, get, list)                       │
│  - Customer Routes (create, list)                           │
│  - Stripe Routes (checkout, webhook)                        │
│  - FCM Routes (register-token, send)                        │
│  - Reminder Routes (schedule, list)                         │
│  - Admin Routes (failed-jobs, queue-metrics)                │
└──────┬─────────────────┬─────────────────┬─────────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ PostgreSQL  │  │  Redis       │  │  External   │
│ (Prisma)    │  │  (BullMQ)    │  │  Services   │
│             │  │              │  │  - Stripe   │
│ - Studio    │  │ - Queue      │  │  - Firebase │
│ - QRCode    │  │ - Worker     │  └─────────────┘
│ - Customer  │  │              │
│ - Reminder  │  └──────────────┘
│ - FailedJob │
└─────────────┘

           ┌──────────────┐
           │ Worker Process│
           │ (BullMQ)      │
           └───────────────┘
```

## Database Schema

### Studio
- Studio account information
- Premium subscription status
- Stripe customer ID

### QRCode
- QR code data
- Piercing type and location
- Jewelry information
- Aftercare instructions
- Links to Studio and Customer

### Customer
- Customer information
- FCM token for push notifications
- Links to Studio

### ScheduledReminder
- Reminder message and schedule
- Status tracking (pending, sent, failed)
- Retry attempt tracking
- Links to Studio, Customer, and QRCode

### FailedJob
- Failed job tracking (DLQ)
- Job type, data, and error details
- Status (failed, retrying, resolved)
- Retry tracking

## API Endpoints

### Authentication
- `POST /auth/register` - Register new studio
- `POST /auth/login` - Login and get JWT token

### QR Codes (requires auth)
- `POST /qr/create` - Create new QR code
- `GET /qr/:id` - Get QR code details
- `GET /qr` - List all QR codes

### Customers (requires auth)
- `POST /customers/create` - Create new customer
- `GET /customers` - List customers

### Stripe (requires auth)
- `POST /stripe/create-checkout-session` - Create checkout session
- `POST /stripe/webhook` - Handle Stripe webhooks

### FCM (requires auth)
- `POST /fcm/register-token` - Register device token
- `POST /fcm/send` - Send push notification

### Reminders (requires auth)
- `POST /reminders/schedule` - Schedule a reminder
- `GET /reminders` - List reminders

### Admin (requires admin token)
- `GET /admin/queue-metrics` - Get queue metrics
- `GET /admin/failed-jobs` - List failed jobs
- `POST /admin/failed-jobs/:id/retry` - Retry failed job
- `DELETE /admin/failed-jobs/:id` - Delete failed job

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL v14+
- Redis v6+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start services:
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start worker
npm run worker

# Terminal 3: Start admin UI
cd frontend
npm install
npm run dev
```

### Configuration

#### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `JWT_SECRET` - Secret for JWT tokens
- `ADMIN_TOKEN` - Token for admin endpoints

#### Optional Environment Variables
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` - For Stripe integration
- `FIREBASE_*` - For Firebase/FCM integration

The system gracefully handles missing Stripe and Firebase credentials.

## Testing Locally

### 1. Test Server
```bash
curl http://localhost:3000/health
```

### 2. Register a Studio
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@studio.com","password":"test123","name":"Test Studio"}'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@studio.com","password":"test123"}'
```

### 4. Access Admin UI
1. Open http://localhost:5173
2. Enter admin token from .env
3. View and manage failed jobs

## Integration Notes

### Mobile App Integration

To integrate this backend with a mobile app:

1. **Authentication**
   - Use the `/auth/register` and `/auth/login` endpoints
   - Store JWT token in secure storage
   - Include token in `Authorization: Bearer <token>` header

2. **QR Code Scanning**
   - Scan QR codes and use the code to fetch data via `/qr/:id`
   - Display aftercare instructions to customers

3. **Push Notifications**
   - Register device FCM tokens via `/fcm/register-token`
   - Handle incoming push notifications for reminders

4. **Premium Features**
   - Initiate Stripe checkout via `/stripe/create-checkout-session`
   - Redirect users to Stripe hosted checkout page
   - Premium status is automatically updated via webhooks

### Security Considerations

Before production deployment:

1. **Authentication**
   - Use strong, unique JWT_SECRET
   - Implement rate limiting
   - Add input validation and sanitization
   - Use HTTPS for all communications

2. **Admin Access**
   - Replace simple token with proper authentication
   - Implement role-based access control
   - Add audit logging

3. **Database**
   - Use connection pooling
   - Implement backup strategy
   - Set up read replicas for scaling

4. **Queue System**
   - Monitor queue health
   - Set up alerts for failed jobs
   - Implement job timeouts

## Monitoring & Observability

Recommended additions:

1. **Application Monitoring**
   - Add Sentry or DataDog for error tracking
   - Log aggregation (e.g., CloudWatch, Elasticsearch)
   - Performance monitoring (APM)

2. **Queue Monitoring**
   - Track job success/failure rates
   - Monitor queue depth
   - Alert on stuck jobs

3. **Database Monitoring**
   - Query performance tracking
   - Connection pool monitoring
   - Slow query logging

## Next Steps

1. **Testing**
   - Add unit tests for business logic
   - Add integration tests for API endpoints
   - Add E2E tests for critical flows

2. **Security**
   - Security audit
   - Penetration testing
   - Implement rate limiting
   - Add CORS configuration

3. **Features**
   - Email notifications alongside FCM
   - SMS notifications
   - Advanced reminder scheduling
   - Customer analytics dashboard

4. **DevOps**
   - CI/CD pipeline
   - Docker containerization
   - Kubernetes deployment
   - Infrastructure as Code (Terraform/CloudFormation)

5. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - Deployment guide
   - Troubleshooting guide
   - Mobile app integration guide

## File Structure

```
.
├── package.json              # Root dependencies
├── .env.example              # Environment variable template
├── .gitignore               # Git ignore rules
├── README.md                # Main documentation
├── IMPLEMENTATION.md        # This file
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── index.js             # Main Express server
│   ├── stripe.js            # Stripe client wrapper
│   ├── fcm.js               # Firebase Admin wrapper
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   ├── premium.js       # Premium check
│   │   └── admin.js         # Admin token check
│   ├── queues/
│   │   └── reminderQueue.js # BullMQ queue wrapper
│   └── workers/
│       └── reminderWorker.js # BullMQ worker process
└── frontend/
    ├── package.json         # Frontend dependencies
    ├── vite.config.js       # Vite configuration
    ├── index.html           # HTML entry point
    ├── README.md            # Frontend documentation
    └── src/
        ├── main.jsx         # React entry point
        ├── index.css        # Global styles
        ├── App.jsx          # Main App component
        ├── App.css          # App styles
        └── components/
            ├── FailedJobsList.jsx    # Failed jobs component
            └── FailedJobsList.css    # Component styles
```

## Dependencies

### Backend
- `express` - Web framework
- `@prisma/client` - Database ORM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `stripe` - Stripe payment processing
- `firebase-admin` - Firebase/FCM integration
- `bullmq` - Queue system
- `ioredis` - Redis client
- `dotenv` - Environment configuration
- `cors` - CORS middleware

### Frontend
- `react` - UI framework
- `react-dom` - React DOM renderer
- `vite` - Build tool and dev server

## License

ISC

## Support

For questions or issues, please refer to the README.md or create an issue in the repository.
