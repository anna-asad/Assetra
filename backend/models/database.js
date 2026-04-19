const { getConnection, sql } = require('../server/config');

// ==================== USER FUNCTIONS ====================
async function findUserByUsername(username) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username AND is_active = 1');
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error finding user:', error);
    throw error; 
  }
}

async function findUserByEmail(email) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email AND is_active = 1');
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.NVarChar, userData.username)
      .input('password_hash', sql.NVarChar, userData.password)
      .input('full_name', sql.NVarChar, userData.full_name)
      .input('email', sql.NVarChar, userData.email)
      .input('role', sql.NVarChar, userData.role)
      .input('department', sql.NVarChar, userData.department)
      .query(`
        INSERT INTO users (username, password_hash, full_name, email, role, department)
        OUTPUT INSERTED.*
        VALUES (@username, @password_hash, @full_name, @email, @role, @department)
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getTotalUsers() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT COUNT(*) as total FROM users WHERE is_active = 1');
    
    return result.recordset[0].total;
  } catch (error) {
    console.error('Error getting total users:', error);
    throw error;
  }
}

// ==================== ASSET FUNCTIONS ====================
async function createAsset(assetData) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_tag', sql.NVarChar, assetData.asset_tag)
      .input('asset_name', sql.NVarChar, assetData.asset_name)
      .input('category', sql.NVarChar, assetData.category)
      .input('description', sql.NVarChar, assetData.description)
      .input('purchase_date', sql.Date, assetData.purchase_date)
      .input('purchase_cost', sql.Decimal(10, 2), assetData.purchase_cost)
      .input('status', sql.NVarChar, assetData.status)
      .input('location', sql.NVarChar, assetData.location)
      .input('department', sql.NVarChar, assetData.department)
      .input('created_by', sql.Int, assetData.created_by)
      .input('maintenance_cost', sql.Decimal(10,2), assetData.maintenance_cost || 0)
      .input('salvage_value', sql.Decimal(10,2), assetData.salvage_value || 0)
      .input('useful_life_years', sql.Int, assetData.useful_life_years || 5)
      .query(`
        INSERT INTO assets (asset_tag, asset_name, category, description, purchase_date, 
                           purchase_cost, status, location, department, created_by, maintenance_cost, salvage_value, useful_life_years)
        OUTPUT INSERTED.*
        VALUES (@asset_tag, @asset_name, @category, @description, @purchase_date, 
                @purchase_cost, @status, @location, @department, @created_by, @maintenance_cost, @salvage_value, @useful_life_years)
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
}

async function getAllAssets(filters = {}) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT a.*, u.full_name as created_by_name 
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.user_id
WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, filters.department);
    }
    
    if (filters.status) {
      query += ' AND a.status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error getting assets:', error);
    throw error;
  }
}

async function getAssetById(assetId, department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT * FROM assets a 
WHERE a.asset_id = @asset_id
    `;
    
    const request = pool.request()
      .input('asset_id', sql.Int, assetId);
    
    if (department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting asset by ID:', error);
    throw error;
  }
}

async function deleteAssetById(assetId, userId) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query('DELETE FROM assets WHERE asset_id = @asset_id');
    return { success: true, message: 'Asset deleted' };
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}



async function updateAssetStatus(assetId, status) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE assets 
        SET status = @status, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE asset_id = @asset_id
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating asset status:', error);
    throw error;
  }
}

async function getTotalAssets() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT COUNT(*) as total FROM assets');
    
    return result.recordset[0].total;
  } catch (error) {
    console.error('Error getting total assets:', error);
    throw error;
  }
}

async function getAssetsByStatus() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT status, COUNT(*) as count 
        FROM assets 
        GROUP BY status
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting assets by status:', error);
    throw error;
  }
}

async function getTotalAssetsByDepartment(department) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('department', sql.NVarChar, department)
      .query('SELECT COUNT(*) as total FROM assets WHERE department = @department');
    
    return result.recordset[0].total;
  } catch (error) {
    console.error('Error getting total assets by department:', error);
    throw error;
  }
}

async function getAssetsByStatusAndDepartment(department) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('department', sql.NVarChar, department)
      .query(`
        SELECT status, COUNT(*) as count 
        FROM assets 
        WHERE department = @department
        GROUP BY status
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting assets by status and department:', error);
    throw error;
  }
}

async function getTotalAssetValue(department = null) {
  try {
    const pool = await getConnection();
    let query = 'SELECT ISNULL(SUM(purchase_cost), 0) as total_value FROM assets';
    
    const request = pool.request();
    
    if (department) {
      query += ' WHERE department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    const result = await request.query(query);
    return parseFloat(result.recordset[0].total_value) || 0;
  } catch (error) {
    console.error('Error getting total asset value:', error);
    return 0;
  }
}

// ==================== ASSET UPDATE/DELETE ====================
async function updateAssetById(assetId, updateData, userId) {
  try {
    const pool = await getConnection();
    const keys = Object.keys(updateData);
    let setClause = keys.map(key => `${key} = @${key}`).join(', ');
    
    const request = pool.request()
      .input('asset_id', sql.Int, assetId)
      .input('updated_by', sql.Int, userId);
    
    keys.forEach(key => {
      request.input(key, sql.NVarChar, updateData[key]);
    });
    
    const result = await request.query(`
      UPDATE assets 
      SET ${setClause}, updated_at = GETDATE(), updated_by = @updated_by
      OUTPUT INSERTED.*
      WHERE asset_id = @asset_id
    `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
}

async function deleteAssetById(assetId, userId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query('DELETE FROM assets WHERE asset_id = @asset_id');
    
    if (result.rowsAffected[0] === 0) {
      return { success: false, message: 'Asset not found' };
    }
    return { success: true, message: 'Asset deleted' };
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

// ==================== NEW DASHBOARD METRICS ====================
async function getMaintenanceCost(department = null) {
  try {
    const pool = await getConnection();
    let query = 'SELECT ISNULL(SUM(maintenance_cost), 0) as total_cost FROM assets';
    const request = pool.request();
    if (department) {
      query += ' WHERE department = @department';
      request.input('department', sql.NVarChar, department);
    }
    const result = await request.query(query);
    return parseFloat(result.recordset[0].total_cost) || 0;
  } catch (error) {
    console.error('Error getting maintenance cost:', error);
    return 0;
  }
}

async function getDepreciation(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT ISNULL(SUM(
        CASE WHEN useful_life_years > 0 AND useful_life_years IS NOT NULL 
          THEN (purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years 
        ELSE 0 END
      ), 0) as total_depreciation FROM assets`;
    const request = pool.request();
    if (department) {
      query += ' WHERE department = @department';
      request.input('department', sql.NVarChar, department);
    }
    const result = await request.query(query);
    return parseFloat(result.recordset[0].total_depreciation) || 0;
  } catch (error) {
    console.error('Error getting depreciation:', error);
    return 0;
  }
}

async function getAuditedCount(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT COUNT(DISTINCT al.entity_id) as count 
      FROM audit_logs al
      JOIN assets a ON al.entity_id = a.asset_id
      WHERE al.entity_type = 'asset'`;
    const request = pool.request();
    if (department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, department);
    }
    const result = await request.query(query);
    return parseInt(result.recordset[0].count) || 0;
  } catch (error) {
    console.error('Error getting audited count:', error);
    return 0;
  }
}

async function getMaintainedCount(department = null) {
  try {
    const pool = await getConnection();
let query = `SELECT COUNT(*) as count FROM assets WHERE status = 'Maintenance'`;
    const request = pool.request();
    if (department) {
query += ` AND department = @department`;
      request.input('department', sql.NVarChar, department);
    }
    const result = await request.query(query);
    return parseInt(result.recordset[0].count) || 0;
  } catch (error) {
    console.error('Error getting maintained count:', error);
    return 0;
  }
}

async function getComplianceScore(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        CASE WHEN total_assets > 0 
          THEN CAST(((compliant * 100.0) / total_assets) AS DECIMAL(5,1))
          ELSE 0 
        END as score
      FROM (
        SELECT 
          COUNT(*) as total_assets,
          COUNT(CASE WHEN status IN ('Available', 'Allocated') THEN 1 END) as compliant
        FROM assets
      ) t`;
    const request = pool.request();
    if (department) {
query = query.replace('FROM assets', 'FROM assets WHERE department = @department');
      request.input('department', sql.NVarChar, department);
    }
    const result = await request.query(query);
    return parseFloat(result.recordset[0].score) || 0;
  } catch (error) {
    console.error('Error getting compliance score:', error);
    return 0;
  }
}

// ==================== ASSIGNMENT FUNCTIONS ====================
async function getAllUsers() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT user_id, username, full_name, department FROM users WHERE is_active = 1 ORDER BY full_name');
    return result.recordset;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function createAssignment(assignmentData) {
  try {
    const pool = await getConnection();
    
    // Deactivate previous assignments for this asset
    await pool.request()
      .input('asset_id', sql.Int, assignmentData.asset_id)
      .query('UPDATE asset_assignments SET is_active = 0 WHERE asset_id = @asset_id AND is_active = 1');
    
    // Create new assignment
    const result = await pool.request()
      .input('asset_id', sql.Int, assignmentData.asset_id)
      .input('assigned_to_user_id', sql.Int, assignmentData.assigned_to_user_id || null)
      .input('assigned_to_department', sql.NVarChar, assignmentData.assigned_to_department || null)
      .input('effective_date', sql.Date, assignmentData.effective_date)
      .input('assigned_by', sql.Int, assignmentData.assigned_by)
      .query(`
        INSERT INTO asset_assignments (asset_id, assigned_to_user_id, assigned_to_department, effective_date, assigned_by)
        OUTPUT INSERTED.*
        VALUES (@asset_id, @assigned_to_user_id, @assigned_to_department, @effective_date, @assigned_by)
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

async function getActiveAssignment(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT aa.*, u.full_name as assigned_to_name, u.username, ab.full_name as assigned_by_name
        FROM asset_assignments aa
        LEFT JOIN users u ON aa.assigned_to_user_id = u.user_id
        LEFT JOIN users ab ON aa.assigned_by = ab.user_id
        WHERE aa.asset_id = @asset_id AND aa.is_active = 1
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting active assignment:', error);
    throw error;
  }
}

async function getAssignmentHistory(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT aa.*, u.full_name as assigned_to_name, ab.full_name as assigned_by_name
        FROM asset_assignments aa
        LEFT JOIN users u ON aa.assigned_to_user_id = u.user_id
        LEFT JOIN users ab ON aa.assigned_by = ab.user_id
        WHERE aa.asset_id = @asset_id
        ORDER BY aa.created_at DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error getting assignment history:', error);
    throw error;
  }
}

// ==================== AUDIT FUNCTIONS ====================
async function logAction(userId, action, entityType, entityId, details) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('action', sql.NVarChar, action)
      .input('entity_type', sql.NVarChar, entityType)
      .input('entity_id', sql.Int, entityId)
      .input('details', sql.NVarChar, details)
      .query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (@user_id, @action, @entity_type, @entity_id, @details)
      `);
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

async function getAuditLogsByAsset(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT al.*, u.full_name as user_name, u.username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.entity_type = 'asset' AND al.entity_id = @asset_id
        ORDER BY al.timestamp DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
}

// ==================== DEPRECIATION & VALUATION FUNCTIONS ====================
async function calculateAssetDepreciation(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT 
          asset_id,
          asset_name,
          purchase_cost,
          salvage_value,
          useful_life_years,
          purchase_date,
          DATEDIFF(YEAR, purchase_date, GETDATE()) as years_in_use,
          CASE 
            WHEN useful_life_years > 0 THEN 
              (purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years
            ELSE 0 
          END as annual_depreciation,
          CASE 
            WHEN useful_life_years > 0 THEN 
              ((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * 
              DATEDIFF(YEAR, purchase_date, GETDATE())
            ELSE 0 
          END as accumulated_depreciation,
          CASE 
            WHEN useful_life_years > 0 THEN 
              purchase_cost - (((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * 
              DATEDIFF(YEAR, purchase_date, GETDATE()))
            ELSE purchase_cost 
          END as current_book_value
        FROM assets
        WHERE asset_id = @asset_id
      `);
    
    const asset = result.recordset[0];
    if (!asset) return null;
    
    // Ensure book value doesn't go below salvage value
    if (asset.current_book_value < (asset.salvage_value || 0)) {
      asset.current_book_value = asset.salvage_value || 0;
    }
    
    return {
      asset_id: asset.asset_id,
      asset_name: asset.asset_name,
      purchase_cost: parseFloat(asset.purchase_cost) || 0,
      salvage_value: parseFloat(asset.salvage_value) || 0,
      useful_life_years: asset.useful_life_years || 0,
      years_in_use: asset.years_in_use || 0,
      annual_depreciation: parseFloat(asset.annual_depreciation) || 0,
      accumulated_depreciation: parseFloat(asset.accumulated_depreciation) || 0,
      current_book_value: parseFloat(asset.current_book_value) || 0,
      depreciation_rate: asset.useful_life_years > 0 ? 
        ((1 / asset.useful_life_years) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error calculating depreciation:', error);
    throw error;
  }
}

async function getDepreciationSummary(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        COUNT(*) as total_assets,
        SUM(purchase_cost) as total_purchase_cost,
        SUM(ISNULL(salvage_value, 0)) as total_salvage_value,
        SUM(
          CASE 
            WHEN useful_life_years > 0 THEN 
              ((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * 
              DATEDIFF(YEAR, purchase_date, GETDATE())
            ELSE 0 
          END
        ) as total_accumulated_depreciation,
        SUM(
          CASE 
            WHEN useful_life_years > 0 THEN 
              purchase_cost - (((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * 
              DATEDIFF(YEAR, purchase_date, GETDATE()))
            ELSE purchase_cost 
          END
        ) as total_current_value
      FROM assets
      WHERE 1=1
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    const result = await request.query(query);
    const summary = result.recordset[0];
    
    return {
      total_assets: summary.total_assets || 0,
      total_purchase_cost: parseFloat(summary.total_purchase_cost) || 0,
      total_salvage_value: parseFloat(summary.total_salvage_value) || 0,
      total_accumulated_depreciation: parseFloat(summary.total_accumulated_depreciation) || 0,
      total_current_value: parseFloat(summary.total_current_value) || 0,
      total_depreciation_percentage: summary.total_purchase_cost > 0 ? 
        ((parseFloat(summary.total_accumulated_depreciation) / parseFloat(summary.total_purchase_cost)) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting depreciation summary:', error);
    throw error;
  }
}

async function getAssetsWithDepreciation(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        asset_id,
        asset_tag,
        asset_name,
        category,
        department,
        purchase_cost,
        salvage_value,
        useful_life_years,
        purchase_date,
        DATEDIFF(YEAR, purchase_date, GETDATE()) as years_in_use,
        CASE 
          WHEN useful_life_years > 0 THEN 
            (purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years
          ELSE 0 
        END as annual_depreciation,
        CASE 
          WHEN useful_life_years > 0 THEN 
            ((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * 
            DATEDIFF(YEAR, purchase_date, GETDATE())
          ELSE 0 
        END as accumulated_depreciation,
        CASE 
          WHEN useful_life_years > 0 THEN 
            purchase_cost - (((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * 
            DATEDIFF(YEAR, purchase_date, GETDATE()))
          ELSE purchase_cost 
        END as current_book_value
      FROM assets
      WHERE 1=1
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    query += ' ORDER BY purchase_date DESC';
    
    const result = await request.query(query);
    
    return result.recordset.map(asset => ({
      ...asset,
      purchase_cost: parseFloat(asset.purchase_cost) || 0,
      salvage_value: parseFloat(asset.salvage_value) || 0,
      annual_depreciation: parseFloat(asset.annual_depreciation) || 0,
      accumulated_depreciation: parseFloat(asset.accumulated_depreciation) || 0,
      current_book_value: Math.max(
        parseFloat(asset.current_book_value) || 0,
        parseFloat(asset.salvage_value) || 0
      )
    }));
  } catch (error) {
    console.error('Error getting assets with depreciation:', error);
    throw error;
  }
}

// ==================== HEALTH SCORE & MAINTENANCE FUNCTIONS ====================
async function calculateHealthScore(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT 
          asset_id,
          asset_name,
          purchase_date,
          warranty_expiry_date,
          last_maintenance_date,
          useful_life_years,
          DATEDIFF(DAY, purchase_date, GETDATE()) as days_old,
          DATEDIFF(DAY, GETDATE(), warranty_expiry_date) as days_until_warranty_expires,
          DATEDIFF(DAY, last_maintenance_date, GETDATE()) as days_since_maintenance
        FROM assets
        WHERE asset_id = @asset_id
      `);
    
    const asset = result.recordset[0];
    if (!asset) return null;
    
    // Calculate age score (0-100, newer is better)
    const usefulLifeDays = (asset.useful_life_years || 5) * 365;
    const ageScore = Math.max(0, 100 - ((asset.days_old / usefulLifeDays) * 100));
    
    // Calculate maintenance score (0-100, recent maintenance is better)
    let maintenanceScore = 50; // Default if never maintained
    if (asset.last_maintenance_date) {
      const daysSinceMaintenance = asset.days_since_maintenance || 0;
      if (daysSinceMaintenance <= 90) {
        maintenanceScore = 100;
      } else if (daysSinceMaintenance <= 180) {
        maintenanceScore = 75;
      } else if (daysSinceMaintenance <= 365) {
        maintenanceScore = 50;
      } else {
        maintenanceScore = 25;
      }
    }
    
    // Calculate warranty score (0-100)
    let warrantyScore = 0;
    if (asset.warranty_expiry_date) {
      const daysUntilExpiry = asset.days_until_warranty_expires || 0;
      if (daysUntilExpiry > 0) {
        warrantyScore = 100;
      } else {
        warrantyScore = 0;
      }
    }
    
    // Overall health score (weighted average)
    const healthScore = Math.round(
      (ageScore * 0.4) + 
      (maintenanceScore * 0.4) + 
      (warrantyScore * 0.2)
    );
    
    return {
      asset_id: assetId,
      health_score: healthScore,
      age_score: Math.round(ageScore),
      maintenance_score: Math.round(maintenanceScore),
      warranty_score: Math.round(warrantyScore),
      days_until_warranty_expires: asset.days_until_warranty_expires,
      days_since_maintenance: asset.days_since_maintenance,
      health_status: healthScore >= 70 ? 'Healthy' : healthScore >= 50 ? 'Warning' : 'Critical'
    };
  } catch (error) {
    console.error('Error calculating health score:', error);
    throw error;
  }
}

async function updateAssetHealthScore(assetId, healthScore) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('asset_id', sql.Int, assetId)
      .input('health_score', sql.Int, healthScore)
      .query('UPDATE assets SET health_score = @health_score WHERE asset_id = @asset_id');
    return true;
  } catch (error) {
    console.error('Error updating health score:', error);
    throw error;
  }
}

async function updateAllHealthScores() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT asset_id FROM assets');
    
    const assets = result.recordset;
    let updated = 0;
    
    for (const asset of assets) {
      const health = await calculateHealthScore(asset.asset_id);
      if (health) {
        await updateAssetHealthScore(asset.asset_id, health.health_score);
        updated++;
      }
    }
    
    return { success: true, updated };
  } catch (error) {
    console.error('Error updating all health scores:', error);
    throw error;
  }
}

async function getMaintenanceAlerts(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        asset_id,
        asset_tag,
        asset_name,
        department,
        status,
        health_score,
        warranty_expiry_date,
        last_maintenance_date,
        DATEDIFF(DAY, GETDATE(), warranty_expiry_date) as days_until_warranty_expires,
        CASE 
          WHEN health_score < 50 THEN 'Critical - Low Health Score'
          WHEN DATEDIFF(DAY, GETDATE(), warranty_expiry_date) <= 30 AND DATEDIFF(DAY, GETDATE(), warranty_expiry_date) > 0 THEN 'Warning - Warranty Expiring Soon'
          WHEN DATEDIFF(DAY, GETDATE(), warranty_expiry_date) < 0 THEN 'Critical - Warranty Expired'
          ELSE 'OK'
        END as alert_reason
      FROM assets
      WHERE (health_score < 50 OR DATEDIFF(DAY, GETDATE(), warranty_expiry_date) <= 30)
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    query += ' ORDER BY health_score ASC, warranty_expiry_date ASC';
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error getting maintenance alerts:', error);
    throw error;
  }
}

async function getAssetsWithHealth(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        asset_id,
        asset_tag,
        asset_name,
        category,
        status,
        department,
        location,
        health_score,
        warranty_expiry_date,
        last_maintenance_date,
        CASE 
          WHEN health_score >= 70 THEN 'Healthy'
          WHEN health_score >= 50 THEN 'Warning'
          ELSE 'Critical'
        END as health_status
      FROM assets
      WHERE 1=1
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    query += ' ORDER BY health_score ASC';
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error getting assets with health:', error);
    throw error;
  }
}

async function recordMaintenance(maintenanceData) {
  try {
    const pool = await getConnection();
    
    // Insert maintenance record
    const result = await pool.request()
      .input('asset_id', sql.Int, maintenanceData.asset_id)
      .input('maintenance_date', sql.Date, maintenanceData.maintenance_date)
      .input('maintenance_type', sql.NVarChar, maintenanceData.maintenance_type)
      .input('notes', sql.NVarChar, maintenanceData.notes)
      .input('performed_by', sql.Int, maintenanceData.performed_by)
      .query(`
        INSERT INTO maintenance_records (asset_id, maintenance_date, maintenance_type, notes, performed_by)
        OUTPUT INSERTED.*
        VALUES (@asset_id, @maintenance_date, @maintenance_type, @notes, @performed_by)
      `);
    
    // Update last maintenance date on asset
    await pool.request()
      .input('asset_id', sql.Int, maintenanceData.asset_id)
      .input('maintenance_date', sql.Date, maintenanceData.maintenance_date)
      .query('UPDATE assets SET last_maintenance_date = @maintenance_date WHERE asset_id = @asset_id');
    
    // Recalculate health score
    const health = await calculateHealthScore(maintenanceData.asset_id);
    if (health) {
      await updateAssetHealthScore(maintenanceData.asset_id, health.health_score);
    }
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error recording maintenance:', error);
    throw error;
  }
}

async function getUniqueDepartments() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`SELECT DISTINCT department FROM assets WHERE department IS NOT NULL ORDER BY department`);
    return result.recordset.map(row => row.department).filter(Boolean);
  } catch (error) {
    console.error('Error getting unique departments:', error);
    throw error;
  }
}

// ==================== EXPORTS ====================
module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  getTotalUsers,
  getAllUsers,
  createAsset,
  getAllAssets,
  getAssetById,
  updateAssetById,
  deleteAssetById,
  updateAssetStatus,
  getTotalAssets,
  getAssetsByStatus,
  getTotalAssetsByDepartment,
  getAssetsByStatusAndDepartment,
  getTotalAssetValue,
  createAssignment,
  getActiveAssignment,
  getAssignmentHistory,
  logAction,
  getAuditLogsByAsset,
  calculateAssetDepreciation,
  getDepreciationSummary,
  getAssetsWithDepreciation,
  calculateHealthScore,
  updateAssetHealthScore,
  updateAllHealthScores,
  getMaintenanceAlerts,
  getAssetsWithHealth,
  recordMaintenance,
  getMaintenanceCost,
  getDepreciation,
  getAuditedCount,
  getMaintainedCount,
  getComplianceScore,
  getUniqueDepartments
};


