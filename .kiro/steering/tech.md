# Assetra Tech Stack

## Backend
- Node.js with Express.js
- JavaScript

## Frontend
- HTML5
- CSS3
- JavaScript (vanilla, no frameworks)

## Database
- SQL Server

## What We Use (NPM Packages)
- express (web framework)
- mssql (connect to SQL Server)
- jsonwebtoken (create login tokens)

## Simple Rules to Follow
1. Always check if user is logged in before showing pages
2. Check user role (Admin or Manager) to decide what they can see
3. Use parameterized queries (always use ? in SQL)
4. Validate form inputs before saving
5. Log every action on assets in the database
6. Keep passwords hashed (bcryptjs)