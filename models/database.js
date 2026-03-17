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
      .query(`
        INSERT INTO assets (asset_tag, asset_name, category, description, purchase_date, 
                           purchase_cost, status, location, department, created_by)
        OUTPUT INSERTED.*
        VALUES (@asset_tag, @asset_name, @category, @description, @purchase_date, 
                @purchase_cost, @status, @location, @department, @created_by)
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
  // User functions
  findUserByUsername,
  findUserByEmail,
  createUser,
  getTotalUsers,
  
  // Asset functions
  createAsset,
  getAllAssets,
  updateAssetStatus,
  getTotalAssets,
  getAssetsByStatus,
  getTotalAssetsByDepartment,
  getAssetsByStatusAndDepartment,
  
  // Audit functions
  logAction
};
