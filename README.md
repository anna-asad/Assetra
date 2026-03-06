# Assetra - Asset Management System

A web-based asset management system for tracking company assets with role-based access control.

## Features (Iteration 1)

- User authentication (Admin and Manager roles)
- Dashboard with asset statistics
- Asset registration and tracking
- Asset status management (Available, Allocated, Maintenance, Missing)
- Audit logging

## Tech Stack

- Backend: Node.js + Express
- Frontend: HTML, CSS, JavaScript
- Database: SQL Server
- Authentication: JWT (jsonwebtoken)

## Prerequisites

- Node.js (v14 or higher)
- SQL Server
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env` file and update with your database credentials
   - Update `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - Change `JWT_SECRET` to a secure random string

4. Set up the database:
   - Open SQL Server Management Studio (SSMS)
   - Run the script in `database/schema.sql`
   - This creates the database, tables, and sample users

## Running the Application

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Assets
- `POST /api/assets` - Create new asset
- `GET /api/assets` - Get all assets (filtered by role)
- `PATCH /api/assets/:id/status` - Update asset status

## Default Users

After running the schema:
- Admin: username `admin`, password `password123`
- Manager: username `manager1`, password `password123`

## Testing with Postman

1. Login:
   ```
   POST http://localhost:3000/api/auth/login
   Body: { "username": "admin", "password": "password123" }
   ```

2. Copy the token from response

3. Use token in subsequent requests:
   ```
   Headers: Authorization: Bearer YOUR_TOKEN_HERE
   ```

## Project Structure

```
assetra/
├── server/           # Server configuration
├── routes/           # API routes
├── controllers/      # Business logic
├── models/           # Database operations
├── middleware/       # Auth and role checking
├── database/         # SQL schema
├── views/            # HTML pages (to be added)
├── public/           # CSS and JS (to be added)
└── .env              # Environment variables
```

## Next Steps

- Build frontend HTML pages
- Add navigation menu
- Implement asset list view
- Create asset registration form
- Add dashboard UI
