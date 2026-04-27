# TODO - Fix Missing Database Columns & Maintenance Alerts / Audit Scheduling

## Plan
1. [x] Add `ensureHealthColumns()` to `backend/models/database.js`
2. [x] Update `createAsset()` in `backend/models/database.js` to include `warranty_expiry_date`
3. [x] Export `ensureHealthColumns` from `backend/models/database.js`
4. [x] Call `ensureHealthColumns()` in `backend/server/server.js` at startup
5. [x] Fix `DROP TABLE departments` placement in `database/schema.sql`
6. [ ] Restart server and test

