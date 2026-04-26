# Admin Resource Management - Iteration 3

## Backend Tasks
- [x] 1. Add DB functions: updateUser, getUserById, resetPassword, getAllDepartments, createDepartment, updateDepartment, deleteDepartment
- [x] 2. Update authController: add updateUser, getUserById, resetPassword, department CRUD handlers
- [x] 3. Update auth routes: add PATCH /users/:id, GET /users/:id, POST /users/:id/reset-password, department routes
- [x] 4. Update schema.sql: add departments table

## Frontend Tasks
- [x] 5. Create user-management.html page
- [x] 6. Create user-management.js with CRUD logic
- [x] 7. Create user-management.css
- [x] 8. Update sidebar.js to add Admin Resource Management link
- [x] 9. Test the full flow

## Summary
All backend and frontend files for Admin Resource Management have been created/updated:

### Backend Changes:
- `backend/models/database.js` - Added getUserById, updateUser, resetPassword, getAllDepartments, createDepartment, updateDepartment, deleteDepartment
- `backend/controllers/authController.js` - Added controllers for user edit, reset password, and department CRUD
- `backend/routes/auth.js` - Added routes: GET/PATCH /users/:id, POST /users/:id/reset-password, department CRUD routes
- `database/schema.sql` - Added departments table

### Frontend Changes:
- `frontend/views/user-management.html` - Admin page with Users and Departments tabs
- `frontend/public/js/user-management.js` - Full CRUD logic for users and departments
- `frontend/public/css/user-management.css` - Styling for the management page
- `frontend/public/js/sidebar.js` - Added "User Management" link for Admin role

### Features Implemented:
1. View all users in a table with role badges
2. Create new users (username, password, role, department)
3. Edit user details (full name, email, role, department)
4. Deactivate/delete users (soft delete via is_active=0)
5. Reset user passwords
6. Manage departments (create, edit, delete)
7. Tab-based navigation between Users and Departments

