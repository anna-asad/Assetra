# Dashboard Bottom Section Update TODO

Status: Planning → Implementation

**Information Gathered:**
- Replace Quick Actions card with:
  - Left: Maintenance Cost PKR card, Depreciated Value PKR card (vertical)
  - Right: Circular compliance % chart + AUDITED/Maintained counts
- Schema: No salvage_value/useful_life/maintenance_cost fields
- Need new DB queries in models/database.js

**Plan:**
1. **models/database.js**: Add functions
   - getMaintenanceCost(dept): SUM(purchase_cost WHERE status='Maintenance')
   - getDepreciatedValue(dept): SUM(purchase_cost * 0.7) (assumed 30% depreciation)
   - getAuditedCount(dept): COUNT(*) FROM audit_logs JOIN assets (action like '%audit%' OR '%status%')
   - getMaintainedCount(dept): COUNT WHERE status='Maintenance'
   - getComplianceScore(dept): 100 - (missing/totalAssets * 100)
2. **controllers/dashboardController.js**: Extend stats response with these 5 values
3. **views/dashboard.html**: Replace actions-card with new layout (2 col flex)
4. **public/css/dashboard.css**: Add styles for cost cards, circular progress (conic-gradient)
5. **public/js/dashboard.js**: Update fetch to populate new fields, animate circle (CSS vars)
6. Restart server, test

**Dependent files:** models/database.js, controllers/dashboardController.js, views/dashboard.html, dashboard.css, dashboard.js

**Follow-up:** npm start after edits, test dashboard bottom section.

Proceed?
