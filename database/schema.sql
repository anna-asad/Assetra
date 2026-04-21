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
    role NVARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Viewer')),
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
    updated_by INT,
    maintenance_cost DECIMAL(10,2) DEFAULT 0,
    salvage_value DECIMAL(10,2) DEFAULT 0,
    useful_life_years INT DEFAULT 5,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
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

-- Asset Assignments Table
CREATE TABLE asset_assignments (
    assignment_id INT PRIMARY KEY IDENTITY(1,1),
    asset_id INT NOT NULL,
    assigned_to_user_id INT,
    assigned_to_department NVARCHAR(50),
    effective_date DATE NOT NULL,
    assigned_by INT NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(user_id),
    FOREIGN KEY (assigned_by) REFERENCES users(user_id)
);
GO

-- Insert Sample Users (plain text passwords for development/learning)
-- Password for both users: 'password123'
INSERT INTO users (username, password_hash, full_name, email, role, department)
VALUES 
('admin', 'password123', 'System Administrator', 'admin@assetra.com', 'Admin', 'IT'),
('manager1', 'password123', 'John Manager', 'manager@assetra.com', 'Manager', 'Operations');
GO



-- FIX: Add missing columns for health tracking and maintenance alerts (SQL Error 207)
ALTER TABLE assets ADD COLUMN health_score INT DEFAULT 50;
ALTER TABLE assets ADD COLUMN warranty_expiry_date DATE NULL;
ALTER TABLE assets ADD COLUMN last_maintenance_date DATE NULL;

-- Set default health score for existing assets
UPDATE assets SET health_score = 50 WHERE health_score IS NULL;

select * from users;
GO

USE assetra_db;
INSERT INTO assets (asset_tag, asset_name, category, status, department, purchase_cost, created_by) VALUES
('CS1', 'CS Laptop', 'Hardware', 'Available', 'Computer Science', 60000, 1),
('CS2', 'CS Monitor', 'Hardware', 'Allocated', 'Computer Science', 15000, 1),
('EE3', 'EE Oscilloscope', 'Hardware', 'Maintenance', 'Electrical Engineering', 25000, 1),
('EE4', 'EE Desk', 'Furniture', 'Missing', 'Electrical Engineering', 8000, 1),
('CE5', 'CE Laptop', 'Hardware', 'Available', 'Civil Engineering', 55000, 1),
('CE6', 'CE Chair', 'Furniture', 'Allocated', 'Civil Engineering', 5000, 1),
('MS7', 'MS PC', 'Hardware', 'Maintenance', 'Management Sciences', 45000, 1),
('SH8', 'SH Projector', 'Hardware', 'Missing', 'Sciences & Humanities IT Services', 30000, 1),
('RO9', 'RO Printer', 'Hardware', 'Available', 'Registrar Office', 12000, 1),
('AF10', 'AF Scanner', 'Hardware', 'Allocated', 'Accounts & Finance', 18000, 1),
('LIB11', 'Library Bookshelf', 'Furniture', 'Maintenance', 'Library', 10000, 1),
('HR12', 'HR Monitor', 'Hardware', 'Missing', 'Administration & HR', 12000, 1),
('EST13', 'Estate Fan', 'Electrical', 'Available', 'Estate Office', 3000, 1),
('CS14', 'CS Mouse', 'Hardware', 'Allocated', 'Computer Science', 2000, 1),
('EE15', 'EE Multimeter', 'Hardware', 'Maintenance', 'Electrical Engineering', 5000, 1),
('CE16', 'CE Projector', 'Hardware', 'Missing', 'Civil Engineering', 25000, 1),
('MS17', 'MS Keyboard', 'Hardware', 'Available', 'Management Sciences', 1500, 1),
('SH18', 'SH Webcam', 'Hardware', 'Allocated', 'Sciences & Humanities IT Services', 3000, 1),
('RO19', 'RO UPS', 'Hardware', 'Maintenance', 'Registrar Office', 20000, 1),
('AF20', 'AF Calculator', 'Hardware', 'Missing', 'Accounts & Finance', 1000, 1);
GO
USE assetra_db;
GO

-- 20 Random Assets (unequal: CS=6, EE=4, CE=3, MS=3, SH=2, RO=1, AF=1)
INSERT INTO assets (asset_tag, asset_name, category, status, department, purchase_cost, created_by, description) VALUES
-- Computer Science (6)
('CS-L1', 'Dell Laptop', 'Computing', 'Available', 'Computer Science', 65000, 1, 'High performance'),
('CS-D1', 'Desk', 'Furniture', 'Allocated', 'Computer Science', 12000, 1, 'Office desk'),
('CS-P1', 'Printer', 'Office Equipment', 'Maintenance', 'Computer Science', 18000, 1, 'Color laser'),
('CS-M1', 'Monitor', 'Computing', 'Available', 'Computer Science', 25000, 1, '27 inch'),
('CS-K1', 'Keyboard', 'Computing', 'Allocated', 'Computer Science', 3000, 1, 'Mechanical'),
('CS-M2', 'Mouse', 'Computing', 'Missing', 'Computer Science', 1500, 1, 'Wireless'),
-- Electrical Engineering (4)
('EE-O1', 'Oscilloscope', 'Electrical Equipment', 'Available', 'Electrical Engineering', 35000, 1, 'Digital'),
('EE-D2', 'Desk Fan', 'Electrical Equipment', 'Maintenance', 'Electrical Engineering', 4000, 1, 'Industrial'),
('EE-M3', 'Multimeter', 'Electrical Equipment', 'Allocated', 'Electrical Engineering', 6000, 1, 'Fluke'),
('EE-C1', 'Chair', 'Furniture', 'Missing', 'Electrical Engineering', 6000, 1, 'Office'),
-- Civil Engineering (3)
('CE-L2', 'Laptop', 'Computing', 'Available', 'Civil Engineering', 55000, 1, 'Engineering CAD'),
('CE-P2', 'Plotter', 'Office Equipment', 'Allocated', 'Civil Engineering', 80000, 1, 'Large format'),
('CE-T1', 'Table', 'Furniture', 'Maintenance', 'Civil Engineering', 15000, 1, 'Conference'),
-- Management Sciences (3)
('MS-P3', 'Projector', 'Office Equipment', 'Missing', 'Management Sciences', 30000, 1, 'Portable'),
('MS-PC1', 'PC', 'Computing', 'Available', 'Management Sciences', 45000, 1, 'Desktop'),
('MS-S1', 'Scanner', 'Office Equipment', 'Allocated', 'Management Sciences', 12000, 1, 'Document'),
-- Sciences & Humanities IT Services (2)
('SH-S2', 'Server Rack', 'Computing', 'Maintenance', 'Sciences & Humanities IT Services', 120000, 1, 'Lab server'),
('SH-C2', 'Cabinet', 'Furniture', 'Available', 'Sciences & Humanities IT Services', 25000, 1, 'IT storage'),
-- Registrar Office (1)
('RO-F1', 'Filing Cabinet', 'Furniture', 'Allocated', 'Registrar Office', 8000, 1, 'Records'),
-- Accounts & Finance (1)
('AF-C1', 'Calculator', 'Office Equipment', 'Missing', 'Accounts & Finance', 2000, 1, 'Financial');

GO

-- Verify
SELECT department, status, COUNT(*) FROM assets GROUP BY department, status ORDER BY department, status;
