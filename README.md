# Piercing QR Premium Module - Backend Demo

This is a complete demo implementation of the Piercing QR premium module backend. It includes a Node.js/Express server, Prisma/PostgreSQL database, JWT authentication, Stripe payment integration, Firebase Cloud Messaging (FCM) for push notifications, BullMQ-based reminder queue system, and a React admin UI for managing failed jobs.

## Features

- **QR Code Management**: Create and manage QR codes for piercings with aftercare information
- **Customer Management**: Store customer information and track their piercings
- **Premium Subscriptions**: Stripe integration for premium features (checkout + webhooks)
- **Push Notifications**: FCM integration for sending reminders
- **Reminder Queue System**: BullMQ-based scheduled reminders with retry logic
- **Failed Job Tracking**: DLQ (Dead Letter Queue) for tracking failed reminder jobs
- **Admin UI**: React-based dashboard for managing failed jobs

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Stripe account (optional, for payment features)
- Firebase project (optional, for push notifications)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `REDIS_HOST` and `REDIS_PORT`: Your Redis server details
- `JWT_SECRET`: A secure random string for JWT tokens
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`: Your Stripe credentials (optional)
- `FIREBASE_*`: Your Firebase credentials (optional)
- `ADMIN_TOKEN`: A secure token for admin API access

**Note**: Stripe and Firebase are optional. The server will work without them, but premium and push notification features will be disabled.

### 3. Set Up Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

This will create all necessary tables in your PostgreSQL database.

### 4. Start the Services

#### Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

#### Start the Reminder Worker (in a separate terminal)

```bash
npm run worker
```

The worker processes scheduled reminders from the BullMQ queue.

### 5. Set Up and Run the Admin UI

```bash
cd frontend
npm install
npm run dev
```

The admin UI will be available at `http://localhost:5173`.

**Admin UI Access**: Set the `x-admin-token` header to match your `ADMIN_TOKEN` from `.env` when making requests.

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new studio
- `POST /auth/login` - Login and get JWT token

### QR Codes (requires authentication)
- `POST /qr/create` - Create a new QR code
- `GET /qr/:id` - Get QR code details
- `GET /qr` - List all QR codes for the authenticated studio

### Stripe (requires authentication and premium subscription)
- `POST /stripe/create-checkout-session` - Create Stripe checkout session
- `POST /stripe/webhook` - Stripe webhook endpoint (for Stripe to call)

### FCM (requires authentication)
- `POST /fcm/send` - Send a push notification
- `POST /fcm/register-token` - Register a device token

### Admin (requires x-admin-token header)
- `GET /admin/failed-jobs` - List all failed jobs
- `POST /admin/failed-jobs/:id/retry` - Retry a failed job
- `DELETE /admin/failed-jobs/:id` - Delete a failed job

## Database Schema

The Prisma schema includes the following models:

- **Studio**: Piercing studio accounts
- **QRCode**: QR codes for individual piercings
- **Customer**: Customer information
- **ScheduledReminder**: Scheduled reminder jobs
- **FailedJob**: Failed job tracking (DLQ)

You can explore the database using Prisma Studio:

```bash
npm run prisma:studio
```

## Development Workflow

1. Make changes to the Prisma schema in `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create and apply migrations
3. The Prisma client will be automatically regenerated

## Testing Locally

### Test Server Startup
```bash
npm run dev
```
Check console output for successful startup and any error messages.

### Test Worker Process
```bash
npm run worker
```
The worker should connect to Redis and start processing jobs.

### Test API Endpoints
Use tools like Postman, curl, or the admin UI to test endpoints:

```bash
# Register a studio
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"studio@example.com","password":"password123","name":"Test Studio"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"studio@example.com","password":"password123"}'
```

## Production Considerations

This is a demo implementation. Before deploying to production:

1. **Security**:
   - Use strong, unique values for `JWT_SECRET` and `ADMIN_TOKEN`
   - Implement rate limiting on API endpoints
   - Add input validation and sanitization
   - Use HTTPS for all communications
   - Secure the admin UI with proper authentication (not just a token header)

2. **Monitoring**:
   - Add application monitoring (e.g., Sentry, DataDog)
   - Set up logging aggregation
   - Monitor queue metrics (job success/failure rates)
   - Track database performance

3. **Scalability**:
   - Use managed PostgreSQL and Redis services
   - Consider horizontal scaling for workers
   - Implement connection pooling
   - Add caching layer

4. **Testing**:
   - Add unit tests for business logic
   - Add integration tests for API endpoints
   - Add end-to-end tests for critical flows

5. **CI/CD**:
   - Set up automated testing
   - Configure deployment pipelines
   - Use environment-based configuration

## Architecture Overview

```
┌─────────────────┐
│   React Admin   │
│      UI         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express Server │◄──────┐
│   (src/index.js)│       │
└────┬─────┬──────┘       │
     │     │               │
     │     └───────────────┤
     │                     │
     ▼                     ▼
┌─────────────┐    ┌──────────────┐
│  PostgreSQL │    │  BullMQ Queue│
│   (Prisma)  │    │    (Redis)   │
└─────────────┘    └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Reminder     │
                   │ Worker       │
                   └──────┬───────┘
                          │
                ┌─────────┼─────────┐
                ▼         ▼         ▼
            [Stripe]   [FCM]    [Email]
```

## File Structure

```
.
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js (main Express server)
│   ├── stripe.js (Stripe client wrapper)
│   ├── fcm.js (Firebase Admin wrapper)
│   ├── middleware/
│   │   ├── auth.js (JWT authentication)
│   │   ├── premium.js (premium check)
│   │   └── admin.js (admin token check)
│   ├── queues/
│   │   └── reminderQueue.js (BullMQ queue)
│   └── workers/
│       └── reminderWorker.js (BullMQ worker)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        └── components/
            └── FailedJobsList.jsx
```

## Next Steps

1. **Secure the Admin UI**: Implement proper authentication instead of simple token header
2. **Add More Tests**: Write comprehensive unit and integration tests
3. **Implement Email Notifications**: Add email support alongside FCM
4. **Add Monitoring Dashboard**: Create a real-time dashboard for system health
5. **Mobile App Integration**: Integrate this backend with the mobile app
6. **API Documentation**: Generate OpenAPI/Swagger documentation
7. **Performance Optimization**: Add caching, optimize database queries
8. **Backup Strategy**: Implement regular database backups

## Support

For questions or issues, please refer to the codebase comments or create an issue in the repository.

## License

ISC
