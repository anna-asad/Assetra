const { getConnection, sql } = require('../server/config');

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
    // Don't throw - audit logging shouldn't break the main flow
  }
}

module.exports = {
  logAction
};
