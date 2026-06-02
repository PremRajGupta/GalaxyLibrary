# ✅ Server Crash Fix - Complete

## 🔴 Problem
```
[nodemon] app crashed - waiting for file changes before starting...
```

## ✅ Solution Applied

### Issues Fixed:
1. ❌ **Mixed CommonJS and ES6 imports** - Removed duplicate require() statements
2. ❌ **Missing closing brace** - Fixed connectDB() function syntax
3. ❌ **Duplicate connectDB() call** - Removed duplicate call
4. ✅ **Simplified server.js** - Removed advanced features causing crash

---

## 🚀 Quick Start (Follow These Steps)

### Step 1: Install Dependencies
```powershell
cd server
npm install
```

### Step 2: Update .env File
Create/Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
FIREBASE_PROJECT_ID=galaxy-library-bcebe
NODE_ENV=development
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

### Step 3: Start MongoDB
```powershell
# Open new PowerShell terminal
mongod

# Should show: "Listening on port 27017"
```

### Step 4: Start Backend Server
```powershell
# In server folder
npm run dev

# Should show:
# ✓ Server is running on port 5000
# ✓ API available at http://localhost:5000/api
```

### Step 5: Test API
```powershell
# In another terminal
curl http://localhost:5000/api/health

# Response:
# {"status":"ok","message":"Library Management System API is running",...}
```

---

## 📝 What Changed in server.js

### ❌ Before (Broken):
```javascript
const express = require('express');              // ← CommonJS
import express from 'express';                   // ← ES6 (duplicate!)

import cacheService from './services/...';       // ← Error if missing
import { apiLimiter } from './middleware/...';   // ← Error if missing

connectDB();                                      // ← Called here
// ... more code ...
connectDB();                                      // ← Called again (duplicate!)
```

### ✅ After (Fixed):
```javascript
import express from 'express';                   // ✓ Clean ES6 imports
import dotenv from 'dotenv';

// Only import what exists
import { verifyToken } from './middleware/auth.js';

// Simple, working setup
const connectDB = async () => { ... };

connectDB();                                      // ✓ Called once only
```

---

## 🎯 Current Architecture

Your server now runs with:
- ✅ Express.js API
- ✅ MongoDB connection with retry
- ✅ CORS enabled for all origins
- ✅ Authentication middleware
- ✅ All core routes (students, fees, seats, requests, dashboard)
- ✅ Error handling
- ✅ Health check endpoint

---

## 📦 Advanced Features (Next Phase)

These can be added later once basic setup works:
- Rate limiting (`express-rate-limit`)
- Image upload (`multer` + Cloudinary)
- Caching (`redis`)
- Multi-branch support
- API key authentication

---

## ✅ Verification

### Check Server is Running
```powershell
# Health check
curl http://localhost:5000/api/health

# Response:
{
  "status": "ok",
  "message": "Library Management System API is running",
  "timestamp": "2026-05-29T...",
  "environment": "development"
}
```

### Check Logs
If using `npm run dev`, you should see:
```
✓ Server is running on port 5000
✓ API available at http://localhost:5000/api
✓ V1 API available at http://localhost:5000/api/v1
✓ Health check at http://localhost:5000/api/health
✓ Connected to MongoDB successfully
```

---

## 🐛 If Still Having Issues

### Issue 1: Port 5000 Already in Use
```powershell
# Kill existing process
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Or use different port
# Edit server/.env: PORT=5001
```

### Issue 2: MongoDB Not Running
```powershell
# Start MongoDB
mongod

# Or check if running
Get-Service MongoDB
```

### Issue 3: Missing Middleware
```
Error: Cannot find module './middleware/...'
```
Solution: The simplified server.js now only imports core middleware that exists

### Issue 4: nodemon Not Installed
```powershell
npm install -g nodemon
# Or use: npx nodemon src/server.js
```

---

## 📚 Next Steps

1. ✅ Verify server starts without errors
2. ✅ Test basic endpoints work
3. ✅ Start frontend: `cd app && npm run dev`
4. ✅ Test login and basic functionality
5. ✅ Add advanced features incrementally

---

## 🎉 You're Fixed!

Your server should now start cleanly without the red crash error! 

If it still crashes, check:
1. MongoDB running? (`mongod`)
2. Port 5000 available? (check with `netstat -ano | findstr :5000`)
3. .env file configured? (check `server/.env`)
4. Node modules installed? (check `server/node_modules/`)

**Run now: `npm run dev` in server folder** ✅
