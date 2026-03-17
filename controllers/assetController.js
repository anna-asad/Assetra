const { createAsset, getAllAssets, updateAssetStatus } = require('../models/database');

async function addAsset(req, res) {
  try {
    const { asset_tag, asset_name, category, description, purchase_date, 
            purchase_cost, status, location, department } = req.body;

    // Simple validation
    if (!asset_tag || !asset_name || !category || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all required fields' 
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

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset: newAsset
    });
  } catch (error) {
    console.error('Error adding asset:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating asset: ' + error.message 
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
      message: 'Error loading assets: ' + error.message 
    });
  }
}

async function changeAssetStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    const updatedAsset = await updateAssetStatus(id, status, req.user.userId);

    res.json({
      success: true,
      message: 'Status updated successfully',
      asset: updatedAsset
    });
  } catch (error) {
    console.error('Error updating asset status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating status: ' + error.message 
    });
  }
}

module.exports = {
  addAsset,
  getAssets,
  changeAssetStatus
};
