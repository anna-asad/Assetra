-- Create Database
CREATE DATABASE assetra_db;
GO

USE assetra_db;
GO

-- Users Table
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
GO

-- Assets Table
CREATE TABLE assets (
    asset_id INT PRIMARY KEY IDENTITY(1,1),
    asset_tag NVARCHAR(50) UNIQUE NOT NULL,
    asset_name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    description NVARCHAR(500),
    purchase_date DATE,
    purchase_cost DECIMAL(10, 2),
    status NVARCHAR(20) NOT NULL CHECK (status IN ('Available', 'Allocated', 'Maintenance', 'Missing')),
    location NVARCHAR(100),
    department NVARCHAR(50),
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
GO

-- Audit Logs Table
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
GO

-- Insert Sample Users (plain text passwords for development/learning)
-- Password for both users: 'password123'
INSERT INTO users (username, password_hash, full_name, email, role, department)
VALUES 
('admin', 'password123', 'System Administrator', 'admin@assetra.com', 'Admin', 'IT'),
('manager1', 'password123', 'John Manager', 'manager@assetra.com', 'Manager', 'Operations');
GO
