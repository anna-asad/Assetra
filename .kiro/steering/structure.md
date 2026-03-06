# Assetra Project Structure

## Folder Layout (Keep It Simple)

```
assetra/
│
├── server/                 # All backend code
│   ├── config.js          # Database connection setup
│   ├── app.js             # Express app setup
│   └── server.js          # Start the server here
│
├── routes/                # URLs and what they do
│   ├── auth.js            # Login/logout routes
│   ├── assets.js          # Asset related routes
│   └── dashboard.js       # Dashboard routes
│
├── controllers/           # What happens when user visits a URL
│   ├── authController.js
│   ├── assetController.js
│   └── dashboardController.js
│
├── models/               # Functions to work with database
│   ├── userModel.js
│   ├── assetModel.js
│   └── auditModel.js
│
├── middleware/           # Checks before processing requests
│   ├── auth.js           # Check if logged in
│   └── roleCheck.js      # Check if Admin or Manager
│
├── views/               # HTML pages users see
│   ├── login.html
│   ├── dashboard.html
│   ├── assetForm.html
│   └── layout.html      # Navigation menu (same on all pages)
│
├── public/              # CSS and JavaScript files
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       └── form.js
│
├── database/            # SQL to create tables
│   └── schema.sql
│
├── .env                 # Passwords and secrets (DON'T share)
├── package.json         # List of libraries
└── README.md           # Instructions for running the project
```

## What Each Folder Does
- **server/** = The main application
- **routes/** = Maps URLs to controller functions
- **controllers/** = Business logic (what to do with data)
- **models/** = SQL queries to database
- **middleware/** = Security checks (auth, roles)
- **views/** = HTML pages
- **public/** = CSS and client-side JavaScript
- **database/** = SQL scripts to create tables