# Piercing QR Admin UI

This is the admin dashboard for managing failed jobs in the Piercing QR backend system.

## Features

- View failed jobs from the BullMQ queue
- Filter jobs by status (all, failed, retrying, resolved)
- Retry failed jobs
- Delete failed jobs
- View queue metrics (waiting, active, completed, failed, delayed)
- Auto-refresh every 30 seconds

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Configuration

The admin UI connects to the backend API at `http://localhost:3000`. Make sure the backend server is running before using the admin UI.

The admin UI requires an admin token to authenticate. This token should match the `ADMIN_TOKEN` environment variable in your backend `.env` file.

## Usage

1. Open the admin UI in your browser
2. Enter your admin token (from the backend `.env` file)
3. View and manage failed jobs

## Building for Production

To build the app for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Technologies Used

- React 18
- Vite
- CSS3

## API Endpoints Used

- `GET /admin/failed-jobs` - List failed jobs
- `GET /admin/queue-metrics` - Get queue metrics
- `POST /admin/failed-jobs/:id/retry` - Retry a failed job
- `DELETE /admin/failed-jobs/:id` - Delete a failed job

All requests include the `x-admin-token` header for authentication.
