# Assetra Project Structure

## Overview
This project follows a clean separation between backend and frontend code.

```
assetra/
├── backend/              # Node.js + Express backend
│   ├── server/          # Server configuration
│   │   ├── app.js       # Express app setup
│   │   ├── config.js    # Database connection
│   │   └── server.js    # Server entry point
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── assets.js    # Asset routes
│   │   └── dashboard.js # Dashboard routes
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── assetController.js
│   │   └── dashboardController.js
│   ├── models/          # Database queries
│   │   └── database.js  # All database functions
│   └── middleware/      # Request middleware
│       ├── auth.js      # JWT authentication
│       └── roleCheck.js # Role-based access control
│
├── frontend/            # HTML, CSS, JavaScript frontend
│   ├── views/          # HTML pages
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── dashboard.html
│   │   ├── assets.html
│   │   ├── add-asset.html
│   │   ├── profile.html
│   │   └── settings.html
│   └── public/         # Static assets
│       ├── css/        # Stylesheets
│       └── js/         # Client-side JavaScript
│
├── database/           # Database scripts
│   └── schema.sql     # Database schema
│
├── docs/              # Documentation
│   └── PROJECT_STRUCTURE.md
│
├── .env               # Environment variables (not in git)
├── .gitignore         # Git ignore rules
├── package.json       # Node.js dependencies
└── README.md          # Project overview
```

## Backend Structure

### Server (`backend/server/`)
- `server.js` - Entry point, starts the Express server
- `app.js` - Express app configuration, middleware, routes
- `config.js` - Database connection setup

### Routes (`backend/routes/`)
Maps HTTP endpoints to controller functions:
- `auth.js` - POST /api/auth/login, /api/auth/signup, /api/auth/logout
- `assets.js` - GET/POST /api/assets, PATCH /api/assets/:id/status
- `dashboard.js` - GET /api/dashboard/stats

### Controllers (`backend/controllers/`)
Business logic for handling requests:
- `authController.js` - Login, signup, logout logic
- `assetController.js` - Asset CRUD operations
- `dashboardController.js` - Dashboard statistics

### Models (`backend/models/`)
Database query functions:
- `database.js` - All SQL queries (users, assets, audit logs)

### Middleware (`backend/middleware/`)
Request processing middleware:
- `auth.js` - Verifies JWT tokens
- `roleCheck.js` - Checks user roles (Admin/Manager)

## Frontend Structure

### Views (`frontend/views/`)
HTML pages served to users:
- `login.html` - Login page
- `signup.html` - User registration
- `dashboard.html` - Main dashboard with KPIs
- `assets.html` - Asset list and management
- `add-asset.html` - Asset registration form
- `profile.html` - User profile page
- `settings.html` - System settings (Admin only)

### Public (`frontend/public/`)
Static assets served directly:
- `css/` - Stylesheets for each page
- `js/` - Client-side JavaScript for each page

## Database Structure

### Tables
- `users` - User accounts (Admin/Manager roles)
- `assets` - Asset inventory
- `audit_logs` - Action history

## Running the Project

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (auto-restart)
npm run dev
```

Server runs on: http://localhost:3000

## Environment Variables

Create `.env` file in root:
```
DB_SERVER=localhost
DB_NAME=assetra_db
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
PORT=3000
```

## Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Database:** Microsoft SQL Server
- **Authentication:** JWT (JSON Web Tokens)
