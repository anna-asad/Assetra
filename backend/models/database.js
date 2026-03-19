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

// ==================== EXPORTS ====================
module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  getTotalUsers,
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
  logAction,
  getMaintenanceCost,
  getDepreciation,
  getAuditedCount,
  getMaintainedCount,
  getComplianceScore
};

