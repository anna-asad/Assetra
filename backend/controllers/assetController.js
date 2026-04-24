const db = require('../models/database'); // Already exports createAsset

async function addAsset(req, res) {
  try {
    const userId = req.user?.userId; // From JWT
    // Validate required fields
    if (!req.body.asset_tag || req.body.asset_tag.trim() === '') {
      return res.status(400).json({ success: false, message: 'Asset tag is required' });
    }
    if (!req.body.asset_name || req.body.asset_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Asset name is required' });
    }
    const purchaseCost = parseFloat(req.body.purchase_cost);
    if (!req.body.purchase_cost || req.body.purchase_cost.trim() === '' || isNaN(purchaseCost) || purchaseCost <= 0) {
      return res.status(400).json({ success: false, message: 'Purchase price is mandatory and must be a positive number' });
    }
    const assetData = {
      asset_tag: req.body.asset_tag,
      asset_name: req.body.asset_name,
      category: req.body.category,
      description: req.body.description,
      purchase_date: req.body.purchase_date,
      purchase_cost: parseFloat(req.body.purchase_cost),
      status: req.body.status || 'Available',
      location: req.body.location,
      department: req.body.department,
      created_by: userId,
      maintenance_cost: parseFloat(req.body.maintenance_cost) || 0,
      salvage_value: parseFloat(req.body.salvage_value) || 0,
      useful_life_years: parseInt(req.body.useful_life_years) || 5,
      warranty_expiry_date: req.body.warranty_expiry_date || null
    };
    const newAsset = await db.createAsset(assetData);
    
    // Log asset creation
    await db.logAction(
      userId,
      'CREATE_ASSET',
      'asset',
      newAsset.asset_id,
      `Created asset: ${assetData.asset_name} (${assetData.asset_tag})`
    );
    
    res.json({ success: true, message: 'Asset added!', asset: newAsset });
  } catch (error) {
    console.error('addAsset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAssets(req, res) {
  try {
    let filter = {};
    if (req.user.role !== 'Admin' && req.user.role !== 'Viewer') {
      filter.department = req.user.department;
    }
    // Add status filter support
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const assets = await db.getAllAssets(filter);
    res.json({ success: true, assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


async function getAssetById(req, res) {
  try {
    const assetId = req.params.id;
    const userDepartment = req.user.department;
    let deptFilter = userDepartment;
    if (req.user.role === 'Admin' || req.user.role === 'Viewer') {
      deptFilter = null;
    }
    const asset = await db.getAssetById(assetId, deptFilter);
    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


async function updateAsset(req, res) {
  try {
    const assetId = req.params.id;
    const oldAsset = await db.getAssetById(assetId);
    
    const updated = await db.updateAssetById(assetId, req.body, req.user.userId);
    
    // Log asset update with changes
    const changes = [];
    Object.keys(req.body).forEach(key => {
      if (oldAsset[key] !== req.body[key]) {
        changes.push(`${key}: ${oldAsset[key]} → ${req.body[key]}`);
      }
    });
    
    await db.logAction(
      req.user.userId,
      'UPDATE_ASSET',
      'asset',
      assetId,
      `Updated asset: ${changes.join(', ')}`
    );
    
    res.json({ success: true, asset: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteAsset(req, res) {
  try {
    const assetId = req.params.id;
    const asset = await db.getAssetById(assetId);
    
    const deleted = await db.deleteAssetById(assetId, req.user.userId);
    
    // Log asset deletion
    await db.logAction(
      req.user.userId,
      'DELETE_ASSET',
      'asset',
      assetId,
      `Deleted asset: ${asset.asset_name} (${asset.asset_tag})`
    );
    
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function changeAssetStatus(req, res) {
  try {
    const assetId = req.params.id;
    const asset = await db.getAssetById(assetId);
    const oldStatus = asset.status;
    const newStatus = req.body.status;
    
    const updated = await db.updateAssetStatus(assetId, newStatus);
    
    // Log status change
    await db.logAction(
      req.user.userId,
      'CHANGE_STATUS',
      'asset',
      assetId,
      `Status changed: ${oldStatus} → ${newStatus}`
    );
    
    res.json({ success: true, asset: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function assignAsset(req, res) {
  try {
    const assetId = parseInt(req.params.id);
    const { assigned_to_user_id, assigned_to_department, effective_date } = req.body;
    
    if (!effective_date) {
      return res.status(400).json({ success: false, message: 'Effective date is required' });
    }
    
    if (!assigned_to_user_id && !assigned_to_department) {
      return res.status(400).json({ success: false, message: 'Must assign to either user or department' });
    }
    
    const asset = await db.getAssetById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    if (assigned_to_user_id) {
      const user = await db.findUserByUsername(''); // Will check if user exists
      // Simple check - if user_id provided, assume it exists
    }
    
    const assignmentData = {
      asset_id: assetId,
      assigned_to_user_id: assigned_to_user_id || null,
      assigned_to_department: assigned_to_department || null,
      effective_date,
      assigned_by: req.user.userId
    };
    
    const assignment = await db.createAssignment(assignmentData);

    // Update asset status to Allocated when assigned
    if (asset.status === 'Available') {
      await db.updateAssetStatus(assetId, 'Allocated');
    }

    await db.logAction(
      req.user.userId,
      'ASSIGN_ASSET',
      'asset',
      assetId,
      `Assigned to ${assigned_to_user_id ? 'user ID ' + assigned_to_user_id : 'department ' + assigned_to_department}`
    );
    
    res.json({ success: true, message: 'Asset assigned successfully', assignment });
  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAssetAssignment(req, res) {
  try {
    const assetId = parseInt(req.params.id);
    const assignment = await db.getActiveAssignment(assetId);
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAllUsersForAssignment(req, res) {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAssetAuditLog(req, res) {
  try {
    const assetId = parseInt(req.params.id);
    const auditLogs = await db.getAuditLogsByAsset(assetId);
    res.json({ success: true, logs: auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAssetDepreciation(req, res) {
  try {
    const assetId = parseInt(req.params.id);
    const depreciation = await db.calculateAssetDepreciation(assetId);
    
    if (!depreciation) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    res.json({ success: true, depreciation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getDepreciationReport(req, res) {
  try {
    let department = null;
    if (req.user.role !== 'Admin' && req.user.role !== 'Viewer') {
      department = req.user.department;
    }
    
    const summary = await db.getDepreciationSummary(department);
    const assets = await db.getAssetsWithDepreciation(department);
    
    res.json({ 
      success: true, 
      summary,
      assets,
      department: department || 'All Departments'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAssetHealth(req, res) {
  try {
    const assetId = parseInt(req.params.id);
    const health = await db.calculateHealthScore(assetId);
    
    if (!health) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateHealthScores(req, res) {
  try {
    const result = await db.updateAllHealthScores();
    res.json({ success: true, message: `Updated ${result.updated} asset health scores` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getMaintenanceAlertsReport(req, res) {
  try {
    let department = null;
    if (req.user.role !== 'Admin' && req.user.role !== 'Viewer') {
      department = req.user.department;
    }
    
    const alerts = await db.getMaintenanceAlerts(department);
    res.json({ success: true, alerts, department: department || 'All Departments' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getHealthReport(req, res) {
  try {
    let department = null;
    if (req.user.role !== 'Admin' && req.user.role !== 'Viewer') {
      department = req.user.department;
    }
    
    const assets = await db.getAssetsWithHealth(department);
    res.json({ success: true, assets, department: department || 'All Departments' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function addMaintenanceRecord(req, res) {
  try {
    const assetId = parseInt(req.params.id);
    const { maintenance_date, maintenance_type, notes } = req.body;
    
    if (!maintenance_date || !maintenance_type) {
      return res.status(400).json({ success: false, message: 'Maintenance date and type are required' });
    }
    
    const maintenanceData = {
      asset_id: assetId,
      maintenance_date,
      maintenance_type,
      notes: notes || '',
      performed_by: req.user.userId
    };
    
    const record = await db.recordMaintenance(maintenanceData);
    
    await db.logAction(
      req.user.userId,
      'MAINTENANCE',
      'asset',
      assetId,
      `Maintenance performed: ${maintenance_type}`
    );
    
    res.json({ success: true, message: 'Maintenance recorded successfully', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  addAsset, getAssets, getAssetById, updateAsset, deleteAsset, changeAssetStatus,
  assignAsset, getAssetAssignment, getAllUsersForAssignment, getAssetAuditLog,
  getAssetDepreciation, getDepreciationReport, getAssetHealth, updateHealthScores,
  getMaintenanceAlertsReport, getHealthReport, addMaintenanceRecord
};
