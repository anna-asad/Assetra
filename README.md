# Assetra - Asset Management System

A web-based asset management system for tracking company assets from procurement to disposal.

## Project Structure

```
assetra/
├── backend/          # Node.js + Express backend
├── frontend/         # HTML, CSS, JavaScript frontend
├── database/         # Database scripts
└── docs/            # Documentation
```

See PROJECT_STRUCTURE.md for detailed structure.

## Features

- User authentication (Admin & Manager roles)
- Role-based access control
- Dashboard with KPI metrics
- Asset registration and tracking
- Asset status management (Available, Allocated, Maintenance, Missing)
- Department-wise asset filtering
- Sidebar navigation

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Microsoft SQL Server
- npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd assetra
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file in root directory
```env
DB_SERVER=localhost
DB_NAME=assetra_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
PORT=3000
```

4. Create database and run schema
```sql
-- In SQL Server Management Studio
CREATE DATABASE assetra_db;
GO

-- Run the schema from database/schema.sql
```

5. Start the server
```bash
npm start
```

6. Open browser and navigate to
```
http://localhost:3000
```

## Usage

### Default Signup Passkey
Use passkey: `assetra2024` when creating new accounts

### User Roles
- **Admin**: Full access to all features and all departments
- **Manager**: Access to assets in their department only

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Microsoft SQL Server
- **Authentication**: JWT (JSON Web Tokens)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Assets
- `GET /api/assets` - Get all assets (filtered by role)
- `POST /api/assets` - Create new asset
- `PATCH /api/assets/:id/status` - Update asset status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Development

```bash
# Run in development mode with auto-restart
npm run dev
```

## Project Status

✅ Iteration 1 Complete (Weeks 1-2)
- User Authentication
- Role-Based Access Control
- Dashboard with KPIs
- Asset Registration
- Asset Status Tracking
- Navigation & Sidebar

## License

This project is for educational purposes.

## Contact

For questions or support, contact the development team.
