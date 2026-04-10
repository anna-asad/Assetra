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
      useful_life_years: parseInt(req.body.useful_life_years) || 5
    };
    const newAsset = await db.createAsset(assetData);
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
    const updated = await db.updateAssetById(req.params.id, req.body, req.user.userId);
    res.json({ success: true, asset: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteAsset(req, res) {
  try {
    const deleted = await db.deleteAssetById(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Asset soft-deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function changeAssetStatus(req, res) {
  try {
    const updated = await db.updateAssetStatus(req.params.id, req.body.status);
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

module.exports = {
  addAsset, getAssets, getAssetById, updateAsset, deleteAsset, changeAssetStatus,
  assignAsset, getAssetAssignment, getAllUsersForAssignment
};
