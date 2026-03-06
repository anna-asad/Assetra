const { createAsset, getAllAssets, updateAssetStatus } = require('../models/assetModel');
const { logAction } = require('../models/auditModel');

async function addAsset(req, res) {
  try {
    const { asset_tag, asset_name, category, description, purchase_date, 
            purchase_cost, status, location, department } = req.body;

    // Validate required fields
    if (!asset_tag || !asset_name || !category || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset tag, name, category, and status are required' 
      });
    }

    // Validate status
    const validStatuses = ['Available', 'Allocated', 'Maintenance', 'Missing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: Available, Allocated, Maintenance, or Missing' 
      });
    }

    const assetData = {
      asset_tag,
      asset_name,
      category,
      description: description || null,
      purchase_date: purchase_date || null,
      purchase_cost: purchase_cost || null,
      status,
      location: location || null,
      department: department || req.user.department,
      created_by: req.user.userId
    };

    const newAsset = await createAsset(assetData);

    // Log the action
    await logAction(
      req.user.userId, 
      'CREATE', 
      'asset', 
      newAsset.asset_id, 
      `Created asset: ${asset_name}`
    );

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset: newAsset
    });
  } catch (error) {
    console.error('Error adding asset:', error);
    
    if (error.message.includes('duplicate') || error.number === 2627) {
      return res.status(409).json({ 
        success: false, 
        message: 'Asset tag already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create asset' 
    });
  }
}

async function getAssets(req, res) {
  try {
    const filters = {};
    
    // Managers can only see assets in their department
    if (req.user.role === 'Manager') {
      filters.department = req.user.department;
    }
    
    // Optional status filter
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const assets = await getAllAssets(filters);

    res.json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    console.error('Error getting assets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve assets' 
    });
  }
}

async function changeAssetStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Available', 'Allocated', 'Maintenance', 'Missing'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: Available, Allocated, Maintenance, or Missing' 
      });
    }

    const updatedAsset = await updateAssetStatus(id, status, req.user.userId);

    if (!updatedAsset) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }

    // Log the action
    await logAction(
      req.user.userId, 
      'UPDATE_STATUS', 
      'asset', 
      parseInt(id), 
      `Changed status to: ${status}`
    );

    res.json({
      success: true,
      message: 'Asset status updated successfully',
      asset: updatedAsset
    });
  } catch (error) {
    console.error('Error updating asset status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update asset status' 
    });
  }
}

module.exports = {
  addAsset,
  getAssets,
  changeAssetStatus
};
