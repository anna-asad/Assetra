# Asset Distribution Bar Chart - Admin Page TODO

## Overall Plan Summary
Create admin-only page with grouped bar chart: X=Departments, Y=Asset Count, 4 bars per dept (Missing, Allocated, Under Maintenance, Available).

## Steps to Complete

- [x] **Step 1:** Read backend/routes/dashboard.js ✓ Ready for edit
- [x] **Step 2:** Added getUniqueDepartments() to backend/models/database.js ✓
- [x] **Step 3:** Added getAssetDistribution to dashboardController.js and fixed routes.js ✓

- [x] **Step 4:** Created frontend/views/asset-distribution.html ✓\n- [x] **Step 5:** Created frontend/public/css/asset-distribution.css ✓\n- [x] **Step 6:** Created frontend/public/js/asset-distribution.js ✓
- [x] **Step 7:** Added Asset Distribution nav link to sidebar.js ✓
- [ ] **Step 8:** Test: Start server, login as admin, check /api/dashboard/asset-distribution, navigate to page, verify chart.
- [ ] **Step 9:** Update this TODO.md (check off completed steps) and attempt_completion.

**Current Progress:** Starting Step 1.
**Notes:** Reuse existing DB functions getAssetsByStatusAndDepartment(dept). Statuses: Missing, Allocated, Maintenance, Available.
