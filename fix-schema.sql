-- ASSETRA SQL FIX: Add missing columns only (safe for existing DB)
-- Run: sqlcmd -S MSI -d assetra_db -i fix-schema.sql

USE assetra_db;
GO

-- Add missing columns (ignore if already exist)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.assets') AND name = 'health_score')
ALTER TABLE assets ADD health_score INT DEFAULT 50;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.assets') AND name = 'warranty_expiry_date')
ALTER TABLE assets ADD warranty_expiry_date DATE NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.assets') AND name = 'last_maintenance_date')
ALTER TABLE assets ADD last_maintenance_date DATE NULL;
GO

-- Set defaults for existing assets
UPDATE assets SET health_score = 50 WHERE health_score IS NULL;
GO

-- Verify columns added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'assets' 
AND COLUMN_NAME IN ('health_score', 'warranty_expiry_date', 'last_maintenance_date')
ORDER BY ORDINAL_POSITION;
GO

PRINT '✅ Schema fix complete! Restart server: Ctrl+C → npm start'

