# Assetra - Iteration 1 Implementation Plan

## Overview
Build a functional asset management system with user authentication, role-based access control, and basic asset tracking capabilities.

---

## 1. Database Schema

### Users Table
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

### Assets Table
```sql
CREATE TABLE assets (
    asset_id INT PRIMARY KEY IDENTITY(1,1),
    asset_tag NVARCHAR(50) UNIQUE NOT NULL,
    asset_name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    description NVARCHAR(500),
    purchase_date DATE,
    purchase_cost DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    status NVARCHAR(20) NOT NULL CHECK (status IN ('Available', 'Allocated', 'Maintenance', 'Missing')),
    location NVARCHAR(100),
    assigned_to INT,
    department NVARCHAR(50),
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    action NVARCHAR(50) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id INT,
    details NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### Sample Data (for testing)
```sql
-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, email, role, department)
VALUES ('admin', '$2a$10$...', 'System Administrator', 'admin@assetra.com', 'Admin', 'IT');

-- Insert sample manager (password: manager123)
INSERT INTO users (username, password_hash, full_name, email, role, department)
VALUES ('manager1', '$2a$10$...', 'John Manager', 'manager@assetra.com', 'Manager', 'Operations');
```

---

## 2. API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Authenticated |
| GET | `/api/auth/verify` | Verify JWT token | Authenticated |
| GET | `/api/auth/profile` | Get current user info | Authenticated |

### Dashboard Routes (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/stats` | Get dashboard statistics | Authenticated |
| GET | `/api/dashboard/recent-assets` | Get recently added assets | Authenticated |

### Asset Routes (`/api/assets`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/assets` | Get all assets (filtered by role) | Authenticated |
| GET | `/api/assets/:id` | Get single asset | Authenticated |
| POST | `/api/assets` | Create new asset | Admin/Manager |
| PUT | `/api/assets/:id` | Update asset | Admin/Manager |
| DELETE | `/api/assets/:id` | Delete asset | Admin only |
| PATCH | `/api/assets/:id/status` | Update asset status | Admin/Manager |

### User Routes (`/api/users`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Admin only |
| GET | `/api/users/:id` | Get single user | Admin only |

---

## 3. File Structure

```
assetra/
│
├── server/
│   ├── config.js              # Database connection config
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
│
├── routes/
│   ├── auth.js                # Authentication routes
│   ├── assets.js              # Asset management routes
│   ├── dashboard.js           # Dashboard routes
│   └── users.js               # User management routes
│
├── controllers/
│   ├── authController.js      # Login, logout, verify token
│   ├── assetController.js     # CRUD operations for assets
│   ├── dashboardController.js # Dashboard statistics
│   └── userController.js      # User management
│
├── models/
│   ├── userModel.js           # User database operations
│   ├── assetModel.js          # Asset database operations
│   └── auditModel.js          # Audit log operations
│
├── middleware/
│   ├── auth.js                # JWT verification middleware
│   ├── roleCheck.js           # Role-based access control
│   └── errorHandler.js        # Global error handler
│
├── utils/
│   ├── jwt.js                 # JWT token generation/verification
│   └── logger.js              # Audit logging helper
│
├── views/
│   ├── login.html             # Login page
│   ├── dashboard.html         # Dashboard page
│   ├── assets.html            # Asset list page
│   ├── asset-form.html        # Add/Edit asset form
│   └── components/
│       ├── navbar.html        # Navigation menu
│       └── sidebar.html       # Sidebar navigation
│
├── public/
│   ├── css/
│   │   ├── style.css          # Main stylesheet
│   │   ├── login.css          # Login page styles
│   │   └── dashboard.css      # Dashboard styles
│   └── js/
│       ├── auth.js            # Client-side auth handling
│       ├── dashboard.js       # Dashboard functionality
│       ├── assets.js          # Asset management UI
│       └── api.js             # API call helper functions
│
├── database/
│   ├── schema.sql             # Database schema
│   └── seed.sql               # Sample data
│
├── .env                       # Environment variables
├── .gitignore                 # Git ignore file
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

---

## 4. Step-by-Step Implementation Tasks

### Phase 1: Project Setup (Day 1)
- [ ] Initialize Node.js project (`npm init`)
- [ ] Install dependencies
  ```bash
  npm install express mssql jsonwebtoken bcryptjs dotenv cors
  npm install --save-dev nodemon
  ```
- [ ] Create folder structure
- [ ] Set up `.env` file with database credentials
- [ ] Create `.gitignore` file

### Phase 2: Database Setup (Day 1-2)
- [ ] Create `database/schema.sql` with all tables
- [ ] Create `database/seed.sql` with sample data
- [ ] Run SQL scripts on SQL Server
- [ ] Create `server/config.js` for database connection
- [ ] Test database connection

### Phase 3: Backend Core (Day 2-3)
- [ ] Create `server/app.js` - Express app setup
- [ ] Create `server/server.js` - Server entry point
- [ ] Create `middleware/errorHandler.js` - Global error handling
- [ ] Create `utils/jwt.js` - JWT helper functions
- [ ] Create `utils/logger.js` - Audit logging helper

### Phase 4: Authentication System (Day 3-4)
- [ ] Create `models/userModel.js` - User database operations
- [ ] Create `controllers/authController.js` - Login/logout logic
- [ ] Create `routes/auth.js` - Auth endpoints
- [ ] Create `middleware/auth.js` - JWT verification
- [ ] Create `middleware/roleCheck.js` - Role-based access
- [ ] Test authentication endpoints with Postman

### Phase 5: Asset Management Backend (Day 4-5)
- [ ] Create `models/assetModel.js` - Asset database operations
- [ ] Create `models/auditModel.js` - Audit log operations
- [ ] Create `controllers/assetController.js` - Asset CRUD logic
- [ ] Create `routes/assets.js` - Asset endpoints
- [ ] Test asset endpoints with Postman

### Phase 6: Dashboard Backend (Day 5-6)
- [ ] Create `controllers/dashboardController.js` - Dashboard stats
- [ ] Create `routes/dashboard.js` - Dashboard endpoints
- [ ] Implement statistics queries (total assets, by status, etc.)
- [ ] Test dashboard endpoints

### Phase 7: Frontend - Login Page (Day 6-7)
- [ ] Create `views/login.html` - Login form
- [ ] Create `public/css/login.css` - Login styles
- [ ] Create `public/js/auth.js` - Login functionality
- [ ] Implement JWT storage in localStorage
- [ ] Add form validation
- [ ] Test login flow

### Phase 8: Frontend - Dashboard (Day 7-8)
- [ ] Create `views/dashboard.html` - Dashboard layout
- [ ] Create `views/components/navbar.html` - Top navigation
- [ ] Create `views/components/sidebar.html` - Side navigation
- [ ] Create `public/css/dashboard.css` - Dashboard styles
- [ ] Create `public/js/dashboard.js` - Dashboard functionality
- [ ] Display statistics cards (total assets, users, etc.)
- [ ] Add charts/graphs (optional for iteration 1)

### Phase 9: Frontend - Asset Management (Day 8-10)
- [ ] Create `views/assets.html` - Asset list page
- [ ] Create `views/asset-form.html` - Add/Edit asset form
- [ ] Create `public/js/assets.js` - Asset management UI
- [ ] Implement asset table with filtering
- [ ] Implement add asset form
- [ ] Implement edit asset functionality
- [ ] Implement status update functionality
- [ ] Add form validation

### Phase 10: Navigation & Integration (Day 10-11)
- [ ] Implement sidebar navigation menu
- [ ] Add route protection (redirect to login if not authenticated)
- [ ] Add role-based UI elements (hide/show based on role)
- [ ] Implement logout functionality
- [ ] Add loading states and error messages

### Phase 11: Testing & Bug Fixes (Day 11-12)
- [ ] Test all user flows (login, dashboard, add asset, etc.)
- [ ] Test role-based access (Admin vs Manager)
- [ ] Test error handling
- [ ] Fix bugs and issues
- [ ] Test on different browsers
- [ ] Verify audit logging works

### Phase 12: Documentation & Deployment Prep (Day 12-14)
- [ ] Write README.md with setup instructions
- [ ] Document API endpoints
- [ ] Add code comments
- [ ] Create deployment checklist
- [ ] Prepare for demo

---

## 5. Key Implementation Details

### JWT Authentication Flow
1. User submits login credentials
2. Server validates credentials against database
3. Server generates JWT token with user info and role
4. Client stores token in localStorage
5. Client includes token in Authorization header for all requests
6. Server middleware verifies token on protected routes

### Role-Based Access Control
```javascript
// Example middleware usage
router.get('/assets', auth, roleCheck(['Admin', 'Manager']), getAssets);
router.delete('/assets/:id', auth, roleCheck(['Admin']), deleteAsset);
```

### Audit Logging
Log every significant action:
- User login/logout
- Asset created/updated/deleted
- Status changes
- User management actions

### Status Tracking
- Available: Asset is ready to be assigned
- Allocated: Asset is assigned to a user
- Maintenance: Asset is being repaired
- Missing: Asset cannot be located

---

## 6. Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_SERVER=localhost
DB_NAME=assetra_db
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 7. Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected route without token
- [ ] Access protected route with expired token
- [ ] Logout functionality

### Role-Based Access
- [ ] Admin can access all features
- [ ] Manager can access allowed features
- [ ] Manager cannot access admin-only features

### Asset Management
- [ ] Create new asset
- [ ] View asset list
- [ ] Edit asset details
- [ ] Update asset status
- [ ] Delete asset (Admin only)
- [ ] Filter assets by status

### Dashboard
- [ ] Display correct statistics
- [ ] Show recent assets
- [ ] Role-based data filtering

---

## 8. Success Criteria

Iteration 1 is complete when:
1. Users can log in with Admin or Manager roles
2. Dashboard displays total assets, users, and status breakdown
3. Assets can be added through a form
4. Asset status can be tracked and updated
5. Navigation menu works across all pages
6. All actions are logged in audit_logs table
7. Role-based access control is enforced
8. Application is stable and bug-free

---

## Next Steps (Future Iterations)

- Asset allocation workflow
- Advanced reporting and analytics
- Asset depreciation calculation
- File upload for asset images/documents
- Email notifications
- Mobile responsive design
- Export to Excel/PDF
- Advanced search and filtering
