# Assetra Project - Backend & Frontend Code Overview

## 🏗️ Architecture
- **Backend:** Node.js + Express + MSSQL (via mssql) + JWT Auth
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Database:** SQL Server (assetra_db.sql schema)
- **Auth:** JWT token-based, role-based access (Admin/Manager)

Server runs on port 3000, serves static public/, routes API at /api/*

## 🔧 Backend Codebase

### Entry Point (`server/server.js`)
```js
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;
async function startServer() {
  await getConnection(); // DB test
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
```

### App Setup (`server/app.js`)
Express with CORS, JSON, static public/, routes /api/auth, /api/assets, /api/dashboard.

### Models (`models/database.js`)
MSSQL queries for users/assets:
- findUserByUsername/Email, createUser
- createAsset, getAllAssets, updateAssetStatus, stats funcs
- Uses server/config.js for pool connection.

### Controllers
**authController.js** (already read): login/signup with jwt.sign(process.env.JWT_SECRET)
**assetController.js:**
```js
async function addAsset(req, res) { // validation, createAsset }
async function getAssets(req, res) { // filters by role/dept }
async function changeAssetStatus(req, res) { }
```
**dashboardController.js** (not read)

### Routes
**auth.js:** POST /login, /signup, /logout (auth protected)
**assets.js:**
```
POST /  roleCheck(['Admin','Manager']) -> addAsset
GET / -> getAssets
PATCH /:id/status roleCheck -> changeAssetStatus
```
**dashboard.js** (not read)

### Middleware
**auth.js:** jwt.verify(token, process.env.JWT_SECRET)
**roleCheck.js:**
```js
function roleCheck(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) res.status(403);
    next();
  };
}
```

## 🎨 Frontend Codebase

### Views (EJS-like HTML templates, 7 pages)
- login.html, signup.html, dashboard.html, assets.html, add-asset.html, profile.html, settings.html
**login.html example:**
```html
<form id=\"loginForm\">
  <input id=\"username\" name=\"username\">
  <input id=\"password\" name=\"password\">
  <button type=\"submit\">Sign in</button>
</form>
<script src=\"/js/login.js\"></script>
```

### Public CSS (8 files)
asset-form.css, assets.css, dashboard.css, login.css, etc.

### Public JS (9 files)
**login.js example:**
```js
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const response = await fetch('/api/auth/login', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/views/dashboard.html';
  }
});
```
- add-asset.js, assets.js, dashboard.js, profile.js, role-ui.js, settings.js, sidebar.js, signup.js

## 📁 Full File Tree
```
backend:
├── server/ (app.js, config.js, server.js)
├── controllers/ (asset, auth, dashboard)
├── routes/ (assets, auth, dashboard)
├── models/ (database.js)
├── middleware/ (auth.js, roleCheck.js)

frontend:
├── views/ (7 HTML)
├── public/css/ (8 CSS)
└── public/js/ (9 JS)
```

**Server running:** localhost:3000
**Next:** Read specific files? `read_file path/to/file.js`
