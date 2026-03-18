# Assetra - Asset Management System
## Final Documentation Report

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Features Implemented](#features-implemented)
5. [Technology Stack](#technology-stack)
6. [Database Design](#database-design)
7. [User Roles and Permissions](#user-roles-and-permissions)
8. [API Documentation](#api-documentation)
9. [Installation Guide](#installation-guide)
10. [User Manual](#user-manual)
11. [Testing and Validation](#testing-and-validation)
12. [Future Enhancements](#future-enhancements)
13. [Conclusion](#conclusion)

---

## 1. Executive Summary

Assetra is a web-based asset management system designed to help organizations track and manage their physical assets from procurement to disposal. The system provides role-based access control, real-time dashboard metrics, and comprehensive asset lifecycle management.

**Project Duration:** Iteration 1 (Weeks 1-2)  
**Status:** ✅ Complete  
**Team Size:** 1 Developer  
**Lines of Code:** ~3,500

---

## 2. Project Overview

### 2.1 Purpose
Assetra solves the following business problems:
- Track asset ownership and location
- Monitor asset status and condition
- Maintain audit trail of asset changes
- Generate reports for compliance
- Manage assets across multiple departments

### 2.2 Scope
**Iteration 1 Deliverables:**
- User authentication system
- Role-based access control
- Dashboard with KPI metrics
- Asset registration and tracking
- Asset status management
- Navigation and site structure

### 2.3 Target Users
- **System Administrators:** Full system access and configuration
- **Department Managers:** Department-specific asset management

---

## 3. System Architecture

### 3.1 Architecture Pattern
The system follows a **Model-View-Controller (MVC)** architecture pattern with clear separation between frontend and backend.

```
┌─────────────────────────────────────────┐
│           Frontend (Client)             │
│  HTML5 + CSS3 + Vanilla JavaScript      │
└──────────────┬──────────────────────────┘
               │ HTTP/HTTPS
               │ REST API
┌──────────────▼──────────────────────────┐
│         Backend (Server)                │
│    Node.js + Express.js                 │
│  ┌────────────────────────────────┐     │
│  │  Routes → Controllers → Models │     │
│  └────────────────────────────────┘     │
└──────────────┬──────────────────────────┘
               │ SQL Queries
┌──────────────▼──────────────────────────┐
│         Database Layer                  │
│      Microsoft SQL Server               │
└─────────────────────────────────────────┘
```

### 3.2 Project Structure
```
assetra/
├── backend/              # Server-side code
│   ├── server/          # Server configuration
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   ├── models/          # Database queries
│   └── middleware/      # Authentication & authorization
├── frontend/            # Client-side code
│   ├── views/          # HTML pages
│   └── public/         # CSS and JavaScript
├── database/           # Database scripts
├── docs/              # Documentation
└── Configuration files
```

### 3.3 Communication Flow
1. User interacts with HTML interface
2. JavaScript sends HTTP request to backend API
3. Express routes request to appropriate controller
4. Controller processes business logic
5. Model executes database queries
6. Response flows back through the layers
7. Frontend updates the UI

---

## 4. Features Implemented

### 4.1 User Authentication
- **Login System:** Secure JWT-based authentication
- **Signup System:** User registration with passkey validation
- **Session Management:** Token-based session handling
- **Logout:** Secure session termination

### 4.2 Role-Based Access Control
- **Admin Role:** Full system access, all departments
- **Manager Role:** Department-specific access
- **Middleware Protection:** Route-level access control
- **UI Adaptation:** Dynamic menu based on user role

### 4.3 Dashboard
- **KPI Metrics:**
  - Total Assets
  - Total Users
  - Missing Assets
  - Assets Under Maintenance
- **Visual Analytics:** Bar chart for asset distribution
- **Department Filtering:** Managers see only their department
- **Real-time Updates:** Live data from database

### 4.4 Asset Management
- **Asset Registration:** Comprehensive form with validation
- **Asset Listing:** Searchable and filterable table
- **Status Management:** Dropdown-based status updates
- **Asset Fields:**
  - Asset Tag (unique identifier)
  - Asset Name
  - Category
  - Status (Available, Allocated, Maintenance, Missing)
  - Purchase Date and Cost
  - Location
  - Department
  - Description

### 4.5 Navigation System
- **Sidebar Navigation:** Persistent menu across all pages
- **Active Page Highlighting:** Visual feedback
- **Role-Based Menu:** Settings visible only to Admins
- **Responsive Design:** Mobile-friendly layout

### 4.6 Additional Features
- **Profile Page:** User information display
- **Settings Page:** System configuration (Admin only)
- **Search Functionality:** Asset search by name, tag, category
- **Status Filtering:** Filter assets by status

---

## 5. Technology Stack

### 5.1 Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v24.14.0 | Runtime environment |
| Express.js | ^4.18.2 | Web framework |
| mssql | ^10.0.1 | SQL Server driver |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| dotenv | ^16.3.1 | Environment variables |
| cors | ^2.8.5 | Cross-origin requests |

### 5.2 Frontend Technologies
| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure |
| CSS3 | Styling and layout |
| Vanilla JavaScript | Client-side logic |
| No frameworks | Lightweight and simple |

### 5.3 Database
| Technology | Purpose |
|------------|---------|
| Microsoft SQL Server | Relational database |
| T-SQL | Query language |

### 5.4 Development Tools
- **Version Control:** Git
- **Code Editor:** VS Code
- **Database Tool:** SQL Server Management Studio
- **API Testing:** Browser DevTools

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     USERS       │         │     ASSETS      │
├─────────────────┤         ├─────────────────┤
│ user_id (PK)    │────┐    │ asset_id (PK)   │
│ username        │    │    │ asset_tag       │
│ password_hash   │    │    │ asset_name      │
│ full_name       │    │    │ category        │
│ email           │    │    │ status          │
│ role            │    │    │ purchase_cost   │
│ department      │    │    │ location        │
│ is_active       │    │    │ department      │
│ created_at      │    └───→│ created_by (FK) │
│ updated_at      │         │ created_at      │
└─────────────────┘         │ updated_at      │
                            └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│   AUDIT_LOGS    │
├─────────────────┤
│ log_id (PK)     │
│ user_id (FK)    │
│ action          │
│ entity_type     │
│ entity_id       │
│ details         │
│ timestamp       │
└─────────────────┘
```

### 6.2 Table Schemas

#### Users Table
```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Manager')),
    department NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

#### Assets Table
```sql
CREATE TABLE assets (
    asset_id INT PRIMARY KEY IDENTITY(1,1),
    asset_tag NVARCHAR(50) UNIQUE NOT NULL,
    asset_name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    description NVARCHAR(500),
    purchase_date DATE,
    purchase_cost DECIMAL(10, 2),
    status NVARCHAR(20) NOT NULL,
    location NVARCHAR(100),
    department NVARCHAR(50),
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    maintenance_cost DECIMAL(10,2) DEFAULT 0,
    salvage_value DECIMAL(10,2) DEFAULT 0,
    useful_life_years INT DEFAULT 5,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    action NVARCHAR(50) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id INT,
    details NVARCHAR(MAX),
    timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## 7. User Roles and Permissions

### 7.1 Admin Role
**Permissions:**
- ✅ View all assets across all departments
- ✅ Create, update, delete assets
- ✅ View all users
- ✅ Access system settings
- ✅ View complete dashboard statistics
- ✅ Manage all departments

**Menu Access:**
- Dashboard
- Assets
- Add Asset
- Profile
- Settings

### 7.2 Manager Role
**Permissions:**
- ✅ View assets in their department only
- ✅ Create assets in their department
- ✅ Update asset status in their department
- ❌ Cannot access other departments
- ❌ Cannot access system settings
- ✅ View department-specific dashboard

**Menu Access:**
- Dashboard (department-filtered)
- Assets (department-filtered)
- Add Asset
- Profile

---

## 8. API Documentation

### 8.1 Authentication Endpoints

#### POST /api/auth/login
**Description:** User login  
**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "admin",
    "fullName": "System Administrator",
    "email": "admin@assetra.com",
    "role": "Admin",
    "department": "IT"
  }
}
```

#### POST /api/auth/signup
**Description:** User registration  
**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "Manager",
  "department": "IT",
  "passkey": "assetra2024"
}
```

#### POST /api/auth/logout
**Description:** User logout  
**Headers:** `Authorization: Bearer <token>`

### 8.2 Asset Endpoints

#### GET /api/assets
**Description:** Get all assets (filtered by role)  
**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:**
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "count": 10,
  "assets": [
    {
      "asset_id": 1,
      "asset_tag": "LAPTOP-001",
      "asset_name": "Dell Laptop",
      "category": "Computing",
      "status": "Available",
      "department": "IT",
      "location": "Office Floor 2",
      "purchase_cost": 1200.00,
      "created_at": "2024-03-15T10:30:00"
    }
  ]
}
```

#### POST /api/assets
**Description:** Create new asset  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "asset_tag": "LAPTOP-002",
  "asset_name": "HP Laptop",
  "category": "Computing",
  "status": "Available",
  "purchase_date": "2024-03-15",
  "purchase_cost": 1100.00,
  "location": "Office Floor 3",
  "department": "IT",
  "description": "HP EliteBook for development"
}
```

#### PATCH /api/assets/:id/status
**Description:** Update asset status  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "status": "Maintenance"
}
```

### 8.3 Dashboard Endpoints

#### GET /api/dashboard/stats
**Description:** Get dashboard statistics  
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAssets": 50,
    "totalUsers": 10,
    "statusBreakdown": {
      "Available": 20,
      "Allocated": 25,
      "Maintenance": 3,
      "Missing": 2
    },
    "department": "IT"
  }
}
```

---

## 9. Installation Guide

### 9.1 Prerequisites
- Node.js v14 or higher
- Microsoft SQL Server 2016 or higher
- npm (Node Package Manager)
- Git (optional)

### 9.2 Step-by-Step Installation

**Step 1: Clone or Download Project**
```bash
git clone <repository-url>
cd assetra
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Configure Environment Variables**

Create `.env` file in root directory:
```env
DB_SERVER=localhost
DB_NAME=assetra_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
PORT=3000
```

**Step 4: Create Database**

Open SQL Server Management Studio and run:
```sql
CREATE DATABASE assetra_db;
GO
```

**Step 5: Run Database Schema**

Execute the `database/schema.sql` file in SSMS.

**Step 6: Start the Server**
```bash
npm start
```

**Step 7: Access the Application**

Open browser and navigate to: `http://localhost:3000`

### 9.3 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `password123`

**Manager Account:**
- Username: `manager1`
- Password: `password123`

**Signup Passkey:** `assetra2024`

---

## 10. User Manual

### 10.1 Login Process
1. Navigate to `http://localhost:3000`
2. Enter username and password
3. Click "Sign In" button
4. Redirected to dashboard upon successful login

### 10.2 Dashboard Usage
- View total assets, users, and status metrics
- See bar chart of asset distribution
- Click "View All Assets" to see asset list
- Click "Add New Asset" to register new asset

### 10.3 Asset Management

**Adding New Asset:**
1. Click "Add Asset" in sidebar
2. Fill in required fields:
   - Asset Tag (unique)
   - Asset Name
   - Category
   - Status
3. Fill optional fields (purchase date, cost, location, etc.)
4. Click "Add Asset" button

**Viewing Assets:**
1. Click "Assets" in sidebar
2. Use search bar to find specific assets
3. Use status filter dropdown to filter by status
4. View asset details in table

**Updating Asset Status:**
1. Go to Assets page
2. Find the asset in the table
3. Select new status from dropdown
4. Status updates automatically

### 10.4 Profile Management
1. Click "Profile" in sidebar
2. View your user information
3. See account details (read-only)

### 10.5 System Settings (Admin Only)
1. Click "Settings" in sidebar
2. View system information
3. See system statistics
4. Access quick actions

---

## 11. Testing and Validation

### 11.1 Test Cases Executed

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-001 | User login with valid credentials | ✅ Pass |
| TC-002 | User login with invalid credentials | ✅ Pass |
| TC-003 | User signup with valid data | ✅ Pass |
| TC-004 | User signup with duplicate username | ✅ Pass |
| TC-005 | Admin can view all departments | ✅ Pass |
| TC-006 | Manager can view only their department | ✅ Pass |
| TC-007 | Dashboard displays correct statistics | ✅ Pass |
| TC-008 | Asset creation with valid data | ✅ Pass |
| TC-009 | Asset status update | ✅ Pass |
| TC-010 | Search functionality | ✅ Pass |
| TC-011 | Status filter functionality | ✅ Pass |
| TC-012 | Settings page restricted to Admin | ✅ Pass |
| TC-013 | Logout functionality | ✅ Pass |
| TC-014 | JWT token validation | ✅ Pass |
| TC-015 | Role-based menu display | ✅ Pass |

### 11.2 Browser Compatibility
- ✅ Google Chrome (Latest)
- ✅ Microsoft Edge (Latest)
- ✅ Mozilla Firefox (Latest)

### 11.3 Known Issues
- None reported in Iteration 1

---

## 12. Future Enhancements

### 12.1 Iteration 2 (Planned)
- Employee assignment tracking
- Asset status history
- Audit trail logging
- Enhanced analytics dashboard
- Real-time notifications

### 12.2 Iteration 3 (Planned)
- Asset depreciation calculations
- Predictive maintenance
- Disposal workflow
- PDF/Excel report export
- Advanced search filters

### 12.3 Long-term Roadmap
- Mobile application
- Barcode/QR code scanning
- Email notifications
- Asset images upload
- Multi-language support
- Advanced reporting

---

## 13. Conclusion

### 13.1 Project Summary
Assetra successfully delivers a functional asset management system that meets all Iteration 1 requirements. The system provides:
- Secure authentication and authorization
- Role-based access control
- Comprehensive asset tracking
- Real-time dashboard metrics
- User-friendly interface

### 13.2 Achievements
- ✅ 100% of Iteration 1 features completed
- ✅ Clean, maintainable code structure
- ✅ Comprehensive documentation
- ✅ All test cases passed
- ✅ Production-ready application

### 13.3 Lessons Learned
- MVC architecture provides clear separation of concerns
- JWT authentication is secure and scalable
- Role-based access control is essential for multi-user systems
- Proper project structure improves maintainability
- Documentation is crucial for project success

### 13.4 Acknowledgments
This project was developed as a learning exercise to understand full-stack web development, database design, and software engineering best practices.

---

## Appendices

### Appendix A: File Structure
See `docs/PROJECT_STRUCTURE.md` for detailed file structure.

### Appendix B: Database Schema
See `database/schema.sql` for complete database schema.

### Appendix C: API Reference
See Section 8 for complete API documentation.

### Appendix D: Environment Variables
```env
DB_SERVER=localhost
DB_NAME=assetra_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
PORT=3000
```

---

**Document Version:** 1.0  
**Last Updated:** March 19, 2026  
**Project Status:** Iteration 1 Complete  
**Next Review:** Start of Iteration 2

---

**End of Report**
