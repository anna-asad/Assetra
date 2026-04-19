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
DELETE FROM assets WHERE asset_tag LIKE 'TEST%'; -- Clean

-- 36 assets: 4 depts x 9 statuses cycle
WITH test_data AS (
  SELECT v.n as id, d.name as dept, s.status
  FROM (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),(31),(32),(33),(34),(35),(36)) v(n)
  CROSS JOIN (VALUES ('Computer Science'), ('Electrical Engineering'), ('Civil Engineering'), ('Management Sciences'), ('Sciences & Humanities IT Services'), ('Registrar Office'), ('Accounts & Finance'), ('Library'), ('Estate Office')) d(name)
  CROSS JOIN (VALUES ('Available'), ('Allocated'), ('Maintenance'), ('Missing')) s(status)
  WHERE v.n <= 36
)
INSERT INTO assets (asset_tag, asset_name, category, status, department, purchase_cost, created_by)
SELECT CONCAT('TEST', ROW_NUMBER() OVER(ORDER BY dept, status)), CONCAT(dept, ' ', status), 'Hardware', status, dept, 50000, 1
FROM test_data;

-- Verify
SELECT department, status, COUNT(*) FROM assets WHERE asset_tag LIKE 'TEST%' GROUP BY department, status ORDER BY department, status;

