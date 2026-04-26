const { getConnection, sql } = require('../server/config');

async function getUserById(userId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT user_id, username, full_name, email, role, department, is_active, created_at FROM users WHERE user_id = @user_id');
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function updateUser(userId, updateData) {
  try {
    const pool = await getConnection();
    const keys = Object.keys(updateData);
    let setClause = keys.map(key => `${key} = @${key}`).join(', ');
    
    const request = pool.request()
      .input('user_id', sql.Int, userId);
    
    keys.forEach(key => {
      request.input(key, sql.NVarChar, updateData[key]);
    });
    
    const result = await request.query(`
      UPDATE users 
      SET ${setClause}, updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE user_id = @user_id
    `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function resetPassword(userId, newPassword) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .input('password_hash', sql.NVarChar, newPassword)
      .query(`
        UPDATE users 
        SET password_hash = @password_hash, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE user_id = @user_id
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

// ==================== DEPARTMENT FUNCTIONS ====================
async function ensureDepartmentsTable() {
  try {
    const pool = await getConnection();
    await pool.request().query('SELECT TOP 1 1 FROM departments');
  } catch (error) {
    if (error.message && error.message.includes("Invalid object name 'departments'")) {
      console.warn('Creating missing departments table');
      const pool = await getConnection();
      await pool.request().query(`
        CREATE TABLE departments (
          department_id INT PRIMARY KEY IDENTITY(1,1),
          department_name NVARCHAR(100) UNIQUE NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        )
      `);
      // Seed with existing departments from assets
      try {
        const fallback = await pool.request()
          .query(`SELECT DISTINCT department AS department_name FROM assets WHERE department IS NOT NULL ORDER BY department`);
        for (const row of fallback.recordset) {
          await pool.request()
            .input('department_name', sql.NVarChar, row.department_name)
            .query(`INSERT INTO departments (department_name) VALUES (@department_name)`);
        }
      } catch (e) {
        console.warn('Could not seed departments from assets:', e.message);
      }
    } else if (!error.message || !error.message.includes("Invalid object name")) {
      throw error;
    }
  }
}

async function getAllDepartments() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM departments ORDER BY department_name');
    
    // Fallback: if departments table is empty, derive from assets
    if (result.recordset.length === 0) {
      const fallback = await pool.request()
        .query(`SELECT DISTINCT department AS department_name FROM assets WHERE department IS NOT NULL ORDER BY department`);
      return fallback.recordset.map(row => ({ department_name: row.department_name }));
    }
    
    return result.recordset;
  } catch (error) {
    // Fallback: if departments table doesn't exist, derive from assets
    if (error.message && error.message.includes("Invalid object name 'departments'")) {
      console.warn('departments table missing, falling back to assets table');
      const pool = await getConnection();
      const fallback = await pool.request()
        .query(`SELECT DISTINCT department AS department_name FROM assets WHERE department IS NOT NULL ORDER BY department`);
      return fallback.recordset.map((row, index) => ({ department_id: index + 1, department_name: row.department_name }));
    }
    console.error('Error getting departments:', error);
    throw error;
  }
}

async function createDepartment(departmentName) {
  try {
    await ensureDepartmentsTable();
    const pool = await getConnection();
    const result = await pool.request()
      .input('department_name', sql.NVarChar, departmentName)
      .query(`
        INSERT INTO departments (department_name)
        OUTPUT INSERTED.*
        VALUES (@department_name)
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
}

async function updateDepartment(departmentId, departmentName) {
  try {
    await ensureDepartmentsTable();
    const pool = await getConnection();
    const result = await pool.request()
      .input('department_id', sql.Int, departmentId)
      .input('department_name', sql.NVarChar, departmentName)
      .query(`
        UPDATE departments 
        SET department_name = @department_name
        WHERE department_id = @department_id;
        SELECT * FROM departments WHERE department_id = @department_id
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
}

async function deleteDepartment(departmentId) {
  try {
    await ensureDepartmentsTable();
    const pool = await getConnection();
    
    // First get the department name
    const deptResult = await pool.request()
      .input('department_id', sql.Int, departmentId)
      .query('SELECT department_name FROM departments WHERE department_id = @department_id');
    
    if (deptResult.recordset.length === 0) {
      return { success: false, message: 'Department not found' };
    }
    
    const departmentName = deptResult.recordset[0].department_name;
    
    // Delete all assets in this department
    await pool.request()
      .input('department', sql.NVarChar, departmentName)
      .query('DELETE FROM assets WHERE department = @department');
    
    // Delete the department
    await pool.request()
      .input('department_id', sql.Int, departmentId)
      .query('DELETE FROM departments WHERE department_id = @department_id');
    
    return { success: true, message: 'Department and all its assets deleted' };
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
}

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
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      // Delete related assignments first to avoid FK constraint
      await transaction.request()
        .input('asset_id', sql.Int, assetId)
        .query('DELETE FROM asset_assignments WHERE asset_id = @asset_id');
      
      // Delete the asset
      const result = await transaction.request()
        .input('asset_id', sql.Int, assetId)
        .query('DELETE FROM assets WHERE asset_id = @asset_id');
      
      await transaction.commit();
      
      if (result.rowsAffected[0] === 0) {
        return { success: false, message: 'Asset not found' };
      }
      return { success: true, message: 'Asset deleted' };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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
    let query = `SELECT COUNT(DISTINCT a.asset_id) as count 
      FROM assets a
      LEFT JOIN maintenance_records mr ON a.asset_id = mr.asset_id
      WHERE a.status = 'Maintenance' OR mr.record_id IS NOT NULL`;
    const request = pool.request();
    if (department) {
      query += ` AND a.department = @department`;
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

async function getAllUsersWithRoles() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT user_id, username, full_name, email, role, department, created_at FROM users WHERE is_active = 1 ORDER BY created_at DESC');
    return result.recordset;
  } catch (error) {
    console.error('Error getting all users with roles:', error);
    throw error;
  }
}

async function getUserCountsByRole() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        WHERE is_active = 1 
        GROUP BY role
      `);
    const counts = { Admin: 0, Manager: 0, Viewer: 0, total: 0 };
    for (const row of result.recordset) {
      counts[row.role] = row.count;
      counts.total += row.count;
    }
    return counts;
  } catch (error) {
    console.error('Error getting user counts by role:', error);
    throw error;
  }
}

async function deleteUserById(userId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('UPDATE users SET is_active = 0 WHERE user_id = @user_id');
    return { success: result.rowsAffected[0] > 0, message: 'User deleted' };
  } catch (error) {
    console.error('Error deleting user:', error);
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
    throw error;
  }
}

// ==================== ADDITIONAL DASHBOARD FUNCTIONS ====================
async function getUniqueDepartments() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT DISTINCT department FROM assets WHERE department IS NOT NULL ORDER BY department');
    return result.recordset.map(row => row.department);
  } catch (error) {
    console.error('Error getting unique departments:', error);
    // Fallback to departments table
    try {
      const departments = await getAllDepartments();
      return departments.map(d => d.department_name);
    } catch (e) {
      console.error('Fallback also failed:', e);
      return [];
    }
  }
}

async function getAssetsByValue() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT department, 
               COUNT(*) as asset_count, 
               SUM(purchase_cost) as total_value
        FROM assets 
        WHERE department IS NOT NULL
        GROUP BY department
        ORDER BY total_value DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error getting assets by value:', error);
    return [];
  }
}

// ==================== HEALTH & MAINTENANCE FUNCTIONS ====================
async function calculateHealthScore(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT 
          a.asset_id,
          a.asset_tag,
          a.asset_name,
          a.purchase_date,
          a.purchase_cost,
          a.status,
          a.department,
          a.health_score,
          a.warranty_expiry_date,
          a.last_maintenance_date,
          a.useful_life_years,
          a.maintenance_cost,
          DATEDIFF(day, a.purchase_date, GETDATE()) as age_days,
          (SELECT MAX(maintenance_date) FROM maintenance_records WHERE asset_id = a.asset_id) as last_mr_date
        FROM assets a
        WHERE a.asset_id = @asset_id
      `);
    
    const asset = result.recordset[0];
    if (!asset) return null;
    
    let score = 100;
    const ageYears = asset.age_days / 365.0;
    
    // Deduct for age (max 30 points)
    score -= Math.min(ageYears * 5, 30);
    
    // Deduct for status
    if (asset.status === 'Maintenance') score -= 20;
    if (asset.status === 'Missing') score -= 40;
    
    // Deduct for expired warranty (15 points)
    if (asset.warranty_expiry_date && new Date(asset.warranty_expiry_date) < new Date()) {
      score -= 15;
    }
    
    // Deduct for lack of maintenance (max 15 points)
    const lastMaint = asset.last_maintenance_date || asset.last_mr_date;
    if (lastMaint) {
      const daysSinceMaint = Math.floor((new Date() - new Date(lastMaint)) / (1000 * 60 * 60 * 24));
      score -= Math.min(daysSinceMaint / 60, 15);
    } else {
      score -= 15; // never maintained
    }
    
    // Deduct high maintenance cost relative to purchase cost
    if (asset.purchase_cost > 0 && asset.maintenance_cost > 0) {
      const ratio = asset.maintenance_cost / asset.purchase_cost;
      score -= Math.min(ratio * 20, 20);
    }
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    // Update stored health score
    await pool.request()
      .input('asset_id', sql.Int, assetId)
      .input('health_score', sql.Int, score)
      .query('UPDATE assets SET health_score = @health_score WHERE asset_id = @asset_id');
    
    return {
      asset_id: asset.asset_id,
      asset_tag: asset.asset_tag,
      asset_name: asset.asset_name,
      health_score: score,
      status: asset.status,
      department: asset.department,
      warranty_expiry_date: asset.warranty_expiry_date,
      last_maintenance_date: lastMaint || asset.last_maintenance_date,
      age_years: parseFloat(ageYears.toFixed(1))
    };
  } catch (error) {
    console.error('Error calculating health score:', error);
    throw error;
  }
}

async function updateAllHealthScores() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT asset_id FROM assets');
    
    let updated = 0;
    for (const row of result.recordset) {
      await calculateHealthScore(row.asset_id);
      updated++;
    }
    return { updated };
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
        a.asset_id,
        a.asset_tag,
        a.asset_name,
        a.department,
        a.health_score,
        a.warranty_expiry_date,
        a.last_maintenance_date,
        a.status,
        a.purchase_date,
        a.purchase_cost,
        DATEDIFF(day, a.purchase_date, GETDATE()) as age_days,
        (SELECT MAX(maintenance_date) FROM maintenance_records WHERE asset_id = a.asset_id) as last_mr_date
      FROM assets a
      WHERE (
        a.health_score < 70 
        OR a.status IN ('Maintenance', 'Missing')
        OR (a.warranty_expiry_date IS NOT NULL AND a.warranty_expiry_date < GETDATE())
        OR (a.last_maintenance_date IS NULL AND NOT EXISTS (SELECT 1 FROM maintenance_records WHERE asset_id = a.asset_id))
      )
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    query += ' ORDER BY a.health_score ASC';
    
    const result = await request.query(query);
    
    const alerts = result.recordset.map(asset => {
      const reasons = [];
      if (asset.health_score < 50) reasons.push('Critical: Very low health score');
      else if (asset.health_score < 70) reasons.push('Warning: Low health score');
      
      if (asset.status === 'Maintenance') reasons.push('Critical: Currently under maintenance');
      if (asset.status === 'Missing') reasons.push('Critical: Asset is missing');
      
      if (asset.warranty_expiry_date && new Date(asset.warranty_expiry_date) < new Date()) {
        reasons.push('Warning: Warranty expired');
      }
      
      const lastMaint = asset.last_maintenance_date || asset.last_mr_date;
      if (!lastMaint) {
        reasons.push('Warning: No maintenance recorded');
      } else {
        const daysSince = Math.floor((new Date() - new Date(lastMaint)) / (1000 * 60 * 60 * 24));
        if (daysSince > 365) reasons.push('Warning: Maintenance overdue (>1 year)');
      }
      
      return {
        asset_id: asset.asset_id,
        asset_tag: asset.asset_tag,
        asset_name: asset.asset_name,
        department: asset.department,
        health_score: asset.health_score,
        alert_reason: reasons.join('; ') || 'Attention required',
        warranty_expiry_date: asset.warranty_expiry_date,
        last_maintenance_date: lastMaint,
        status: asset.status
      };
    });
    
    return alerts;
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
        a.*,
        u.full_name as created_by_name,
        (SELECT MAX(maintenance_date) FROM maintenance_records WHERE asset_id = a.asset_id) as last_mr_date
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE 1=1
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    query += ' ORDER BY a.health_score ASC';
    
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
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      // Insert maintenance record
      const result = await transaction.request()
        .input('asset_id', sql.Int, maintenanceData.asset_id)
        .input('maintenance_date', sql.Date, maintenanceData.maintenance_date)
        .input('maintenance_type', sql.NVarChar, maintenanceData.maintenance_type)
        .input('notes', sql.NVarChar, maintenanceData.notes || '')
        .input('performed_by', sql.Int, maintenanceData.performed_by)
        .query(`
          INSERT INTO maintenance_records (asset_id, maintenance_date, maintenance_type, notes, performed_by)
          OUTPUT INSERTED.*
          VALUES (@asset_id, @maintenance_date, @maintenance_type, @notes, @performed_by)
        `);
      
      // Update asset last_maintenance_date
      await transaction.request()
        .input('asset_id', sql.Int, maintenanceData.asset_id)
        .input('last_maintenance_date', sql.Date, maintenanceData.maintenance_date)
        .query(`
          UPDATE assets 
          SET last_maintenance_date = @last_maintenance_date, updated_at = GETDATE()
          WHERE asset_id = @asset_id
        `);
      
      await transaction.commit();
      return result.recordset[0];
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error recording maintenance:', error);
    throw error;
  }
}

async function getAuditLogsByAsset(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT al.*, u.full_name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.entity_type = 'asset' AND al.entity_id = @asset_id
        ORDER BY al.timestamp DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error getting audit logs by asset:', error);
    throw error;
  }
}

// ==================== DEPRECIATION FUNCTIONS ====================
async function calculateAssetDepreciation(assetId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('asset_id', sql.Int, assetId)
      .query(`
        SELECT 
          asset_id,
          asset_tag,
          asset_name,
          purchase_date,
          purchase_cost,
          salvage_value,
          useful_life_years,
          DATEDIFF(year, purchase_date, GETDATE()) as years_used
        FROM assets
        WHERE asset_id = @asset_id
      `);
    
    const asset = result.recordset[0];
    if (!asset) return null;
    
    const cost = parseFloat(asset.purchase_cost) || 0;
    const salvage = parseFloat(asset.salvage_value) || 0;
    const life = parseInt(asset.useful_life_years) || 5;
    const yearsUsed = Math.max(0, asset.years_used);
    
    const annualDepreciation = life > 0 ? (cost - salvage) / life : 0;
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsUsed, cost - salvage);
    const currentBookValue = Math.max(cost - accumulatedDepreciation, salvage);
    const remainingLife = Math.max(life - yearsUsed, 0);
    
    return {
      asset_id: asset.asset_id,
      asset_tag: asset.asset_tag,
      asset_name: asset.asset_name,
      purchase_cost: cost,
      salvage_value: salvage,
      useful_life_years: life,
      years_used: yearsUsed,
      annual_depreciation: parseFloat(annualDepreciation.toFixed(2)),
      accumulated_depreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
      current_book_value: parseFloat(currentBookValue.toFixed(2)),
      remaining_life_years: remainingLife
    };
  } catch (error) {
    console.error('Error calculating asset depreciation:', error);
    throw error;
  }
}

async function getDepreciationSummary(department = null) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        COUNT(*) as total_assets,
        SUM(purchase_cost) as total_cost,
        SUM(salvage_value) as total_salvage,
        SUM(CASE WHEN useful_life_years > 0 THEN (purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years ELSE 0 END) as annual_depreciation,
        SUM(
          CASE 
            WHEN useful_life_years > 0 THEN 
              ((purchase_cost - ISNULL(salvage_value, 0)) / useful_life_years) * DATEDIFF(year, purchase_date, GETDATE())
            ELSE 0 
          END
        ) as accumulated_depreciation
      FROM assets
      WHERE 1=1
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    const result = await request.query(query);
    const row = result.recordset[0];
    
    return {
      total_assets: parseInt(row.total_assets) || 0,
      total_cost: parseFloat(row.total_cost) || 0,
      total_salvage: parseFloat(row.total_salvage) || 0,
      annual_depreciation: parseFloat(row.annual_depreciation) || 0,
      accumulated_depreciation: parseFloat(row.accumulated_depreciation) || 0,
      net_book_value: (parseFloat(row.total_cost) || 0) - (parseFloat(row.accumulated_depreciation) || 0)
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
        a.*,
        u.full_name as created_by_name,
        DATEDIFF(year, a.purchase_date, GETDATE()) as years_used
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE 1=1
    `;
    
    const request = pool.request();
    if (department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    query += ' ORDER BY a.purchase_cost DESC';
    
    const result = await request.query(query);
    
    return result.recordset.map(asset => {
      const cost = parseFloat(asset.purchase_cost) || 0;
      const salvage = parseFloat(asset.salvage_value) || 0;
      const life = parseInt(asset.useful_life_years) || 5;
      const yearsUsed = Math.max(0, asset.years_used);
      
      const annualDepreciation = life > 0 ? (cost - salvage) / life : 0;
      const accumulatedDepreciation = Math.min(annualDepreciation * yearsUsed, cost - salvage);
      const currentBookValue = Math.max(cost - accumulatedDepreciation, salvage);
      
      return {
        ...asset,
        annual_depreciation: parseFloat(annualDepreciation.toFixed(2)),
        accumulated_depreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
        current_book_value: parseFloat(currentBookValue.toFixed(2)),
        years_used: yearsUsed
      };
    });
  } catch (error) {
    console.error('Error getting assets with depreciation:', error);
    throw error;
  }
}

async function getAssetsWithAuditTrail(filters = {}) {
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        a.*,
        u.full_name as created_by_name
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.department) {
      query += ' AND a.department = @department';
      request.input('department', sql.NVarChar, filters.department);
    }
    
    if (filters.startDate) {
      query += ' AND a.created_at >= @startDate';
      request.input('startDate', sql.DateTime, filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND a.created_at <= @endDate';
      request.input('endDate', sql.DateTime, filters.endDate);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await request.query(query);
    const assets = result.recordset;
    
    // Fetch audit logs for each asset
    for (const asset of assets) {
      const logsResult = await pool.request()
        .input('asset_id', sql.Int, asset.asset_id)
        .query(`
          SELECT al.*, u.full_name as user_name
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.user_id
          WHERE al.entity_type = 'asset' AND al.entity_id = @asset_id
          ORDER BY al.timestamp DESC
        `);
      asset.audit_logs = logsResult.recordset;
    }
    
    return assets;
  } catch (error) {
    console.error('Error getting assets with audit trail:', error);
    throw error;
  }
}

// ==================== AUDIT SCHEDULING FUNCTIONS ====================

async function createScheduledAudit(data) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('schedule_name', sql.NVarChar, data.schedule_name)
      .input('frequency', sql.NVarChar, data.frequency)
      .input('schedule_time', sql.NVarChar, data.schedule_time)
      .input('day_of_week', sql.Int, data.day_of_week)
      .input('day_of_month', sql.Int, data.day_of_month)
      .input('created_by', sql.Int, data.created_by)
      .input('next_run_at', sql.DateTime, data.next_run_at)
      .query(`
        INSERT INTO scheduled_audits (schedule_name, frequency, schedule_time, day_of_week, day_of_month, created_by, next_run_at)
        OUTPUT INSERTED.*
        VALUES (@schedule_name, @frequency, @schedule_time, @day_of_week, @day_of_month, @created_by, @next_run_at)
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating scheduled audit:', error);
    throw error;
  }
}

async function getAllScheduledAudits() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM scheduled_audits ORDER BY created_at DESC');
    return result.recordset;
  } catch (error) {
    console.error('Error getting scheduled audits:', error);
    throw error;
  }
}

async function updateScheduledAudit(scheduleId, updateData) {
  try {
    const pool = await getConnection();
    const keys = Object.keys(updateData);
    if (keys.length === 0) throw new Error('No fields to update');
    let setClause = keys.map(key => `${key} = @${key}`).join(', ');

    const request = pool.request()
      .input('schedule_id', sql.Int, scheduleId);

    keys.forEach(key => {
      let type = sql.NVarChar;
      if (key === 'is_active') type = sql.Bit;
      else if (key === 'next_run_at' || key === 'last_run_at') type = sql.DateTime;
      else if (key === 'day_of_week' || key === 'day_of_month' || key === 'created_by') type = sql.Int;
      request.input(key, type, updateData[key]);
    });

    const result = await request.query(`
      UPDATE scheduled_audits
      SET ${setClause}
      OUTPUT INSERTED.*
      WHERE schedule_id = @schedule_id
    `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating scheduled audit:', error);
    throw error;
  }
}

async function deleteScheduledAudit(scheduleId) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('schedule_id', sql.Int, scheduleId)
      .query('DELETE FROM scheduled_audits WHERE schedule_id = @schedule_id');
    return { success: true };
  } catch (error) {
    console.error('Error deleting scheduled audit:', error);
    throw error;
  }
}

async function executeAudit(data) {
  try {
    const pool = await getConnection();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const execResult = await transaction.request()
        .input('schedule_id', sql.Int, data.schedule_id)
        .input('execution_type', sql.NVarChar, data.execution_type)
        .input('executed_by', sql.Int, data.executed_by)
        .input('notes', sql.NVarChar, data.notes || null)
        .query(`
          INSERT INTO audit_executions (schedule_id, execution_type, executed_by, notes)
          OUTPUT INSERTED.*
          VALUES (@schedule_id, @execution_type, @executed_by, @notes)
        `);

      const execution = execResult.recordset[0];

      const assetsResult = await transaction.request()
        .query(`
          SELECT
            a.asset_id, a.asset_tag, a.asset_name, a.status, a.department, a.location, a.health_score,
            a.last_maintenance_date,
            (SELECT MAX(maintenance_date) FROM maintenance_records WHERE asset_id = a.asset_id) as last_mr_date
          FROM assets a
        `);

      const assets = assetsResult.recordset;
      let missingCount = 0;
      let overdueMaintenanceCount = 0;

      for (const asset of assets) {
        const isMissing = asset.status === 'Missing' ? 1 : 0;
        const lastMaint = asset.last_maintenance_date || asset.last_mr_date;
        let isOverdue = 0;
        if (asset.status === 'Maintenance') {
          isOverdue = 1;
        } else if (!lastMaint) {
          isOverdue = 1;
        } else {
          const daysSince = Math.floor((new Date() - new Date(lastMaint)) / (1000 * 60 * 60 * 24));
          if (daysSince > 365) isOverdue = 1;
        }

        if (isMissing) missingCount++;
        if (isOverdue) overdueMaintenanceCount++;

        await transaction.request()
          .input('execution_id', sql.Int, execution.execution_id)
          .input('asset_id', sql.Int, asset.asset_id)
          .input('asset_tag', sql.NVarChar, asset.asset_tag)
          .input('asset_name', sql.NVarChar, asset.asset_name)
          .input('status', sql.NVarChar, asset.status)
          .input('department', sql.NVarChar, asset.department)
          .input('location', sql.NVarChar, asset.location)
          .input('health_score', sql.Int, asset.health_score)
          .input('is_overdue_maintenance', sql.Bit, isOverdue)
          .input('is_missing', sql.Bit, isMissing)
          .query(`
            INSERT INTO audit_results (execution_id, asset_id, asset_tag, asset_name, status, department, location, health_score, is_overdue_maintenance, is_missing)
            VALUES (@execution_id, @asset_id, @asset_tag, @asset_name, @status, @department, @location, @health_score, @is_overdue_maintenance, @is_missing)
          `);
      }

      const statusCounts = await transaction.request()
        .input('execution_id', sql.Int, execution.execution_id)
        .query(`
          SELECT
            COUNT(*) as total_assets,
            SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_count,
            SUM(CASE WHEN status = 'Allocated' THEN 1 ELSE 0 END) as allocated_count,
            SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance_count,
            SUM(CASE WHEN status = 'Missing' THEN 1 ELSE 0 END) as missing_count
          FROM audit_results
          WHERE execution_id = @execution_id
        `);

      const counts = statusCounts.recordset[0];

      await transaction.request()
        .input('execution_id', sql.Int, execution.execution_id)
        .input('total_assets', sql.Int, counts.total_assets || 0)
        .input('available_count', sql.Int, counts.available_count || 0)
        .input('allocated_count', sql.Int, counts.allocated_count || 0)
        .input('maintenance_count', sql.Int, counts.maintenance_count || 0)
        .input('missing_count', sql.Int, counts.missing_count || 0)
        .input('overdue_maintenance_count', sql.Int, overdueMaintenanceCount)
        .query(`
          UPDATE audit_executions
          SET total_assets = @total_assets,
              available_count = @available_count,
              allocated_count = @allocated_count,
              maintenance_count = @maintenance_count,
              missing_count = @missing_count,
              overdue_maintenance_count = @overdue_maintenance_count
          WHERE execution_id = @execution_id
        `);

      await transaction.commit();

      const updatedExec = await pool.request()
        .input('execution_id', sql.Int, execution.execution_id)
        .query(`
          SELECT ae.*, u.full_name as executed_by_name
          FROM audit_executions ae
          LEFT JOIN users u ON ae.executed_by = u.user_id
          WHERE ae.execution_id = @execution_id
        `);

      return updatedExec.recordset[0];
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error executing audit:', error);
    throw error;
  }
}

async function getAuditExecutions(limit = 50) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) ae.*, u.full_name as executed_by_name
        FROM audit_executions ae
        LEFT JOIN users u ON ae.executed_by = u.user_id
        ORDER BY ae.executed_at DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error getting audit executions:', error);
    throw error;
  }
}

async function getAuditExecutionById(executionId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('execution_id', sql.Int, executionId)
      .query(`
        SELECT ae.*, u.full_name as executed_by_name
        FROM audit_executions ae
        LEFT JOIN users u ON ae.executed_by = u.user_id
        WHERE ae.execution_id = @execution_id
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting audit execution:', error);
    throw error;
  }
}

async function getAuditResults(executionId) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('execution_id', sql.Int, executionId)
      .query(`
        SELECT *
        FROM audit_results
        WHERE execution_id = @execution_id
        ORDER BY asset_id
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error getting audit results:', error);
    throw error;
  }
}

async function updateScheduleNextRun(scheduleId, nextRun) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('schedule_id', sql.Int, scheduleId)
      .input('next_run_at', sql.DateTime, nextRun)
      .input('last_run_at', sql.DateTime, new Date())
      .query(`
        UPDATE scheduled_audits
        SET next_run_at = @next_run_at, last_run_at = @last_run_at
        OUTPUT INSERTED.*
        WHERE schedule_id = @schedule_id
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating schedule next run:', error);
    throw error;
  }
}

module.exports = {
  // User functions
  getUserById,
  updateUser,
  resetPassword,
  findUserByUsername,
  findUserByEmail,
  createUser,
  getTotalUsers,
  getAllUsers,
  getAllUsersWithRoles,
  getUserCountsByRole,
  deleteUserById,
  
  // Department functions
  ensureDepartmentsTable,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Asset functions
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
  
  // Dashboard metrics
  getMaintenanceCost,
  getDepreciation,
  getAuditedCount,
  getMaintainedCount,
  getComplianceScore,
  getUniqueDepartments,
  getAssetsByValue,
  
  // Health & Maintenance
  calculateHealthScore,
  updateAllHealthScores,
  getMaintenanceAlerts,
  getAssetsWithHealth,
  recordMaintenance,
  
  // Depreciation
  calculateAssetDepreciation,
  getDepreciationSummary,
  getAssetsWithDepreciation,
  
  // Audit & Reports
  getAuditLogsByAsset,
  getAssetsWithAuditTrail,
  
  // Assignment functions
  createAssignment,
  getActiveAssignment,
  getAssignmentHistory,
  
  // Audit functions
  logAction,

  // Audit Scheduling
  createScheduledAudit,
  getAllScheduledAudits,
  updateScheduledAudit,
  deleteScheduledAudit,
  executeAudit,
  getAuditExecutions,
  getAuditExecutionById,
  getAuditResults,
  updateScheduleNextRun
};
