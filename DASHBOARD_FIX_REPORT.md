# Dashboard Compliance Overview - Bug Report & Fix

## Issue Found: ❌ Maintained Assets Showing Incorrect Count

### Problem Summary
The "Maintained Assets" count in the Compliance Overview box was displaying **incorrect values** - it was counting "Available" and "Allocated" assets instead of assets that are actually under maintenance.

---

## Detailed Analysis

### Before Fix (INCORRECT):
```sql
SELECT COUNT(*) as count FROM assets WHERE status IN ('Available', 'Allocated')
```
- **Result**: 3 assets (Active/usable assets)
- **Expected**: 1 asset (Assets under maintenance)
- **Bug**: Counting the WRONG asset status

### After Fix (CORRECT):
```sql
SELECT COUNT(DISTINCT a.asset_id) as count 
FROM assets a
LEFT JOIN maintenance_records mr ON a.asset_id = mr.asset_id
WHERE a.status = 'Maintenance' OR mr.maintenance_id IS NOT NULL
```
- **Result**: 1 asset (Correctly counts assets with Maintenance status OR those with maintenance records)
- **Status**: ✅ FIXED

---

## Current Database State

| Metric | Count | Notes |
|--------|-------|-------|
| **Audited Assets** | 5 | ✅ Correct - counts distinct assets from audit_logs |
| **Maintained Assets** | 1 | ✅ FIXED - now correctly counts assets with status='Maintenance' |
| **Total Assets** | 5 | Available: 2, Allocated: 1, Maintenance: 1, Missing: 1 |

---

## Code Change Made

**File**: [backend/models/database.js](backend/models/database.js#L382)

**Function**: `getMaintainedCount(department = null)`

**What Was Changed**:
- Replaced incorrect query that counted Available/Allocated assets
- Updated to count assets with status='Maintenance' OR those with maintenance records
- Added DISTINCT to prevent duplicates if an asset has multiple maintenance records

---

## Testing Verification

✅ **Query Execution**: Successfully tested and confirmed
- Query returns 1 (correct count of maintained assets)
- Works with department filtering
- No SQL errors

---

## Impact

- Dashboard "Compliance Overview" box will now display the correct "Maintained Assets" count
- No breaking changes to other functionality
- Works for both global (Admin/Viewer) and department-specific (Manager) views

---

## Recommendation

If you have added more maintenance records, the count will automatically update. To test:
1. Refresh the dashboard page
2. The Maintained Assets count should now show 1 (or higher if you've added maintenance records)

