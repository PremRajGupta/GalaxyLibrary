# Quick MongoDB Setup - Visual Guide

## 🎯 The 3-Step Quick Start

```
┌─────────────────────────────────────────────────────────────┐
│                    SETUP MONGODB                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: INSTALL MONGODB                                   │
│  ├─ Download: https://www.mongodb.com/try/download/community
│  ├─ Run installer (choose "Install as Service")            │
│  └─ Verify: mongod --version                               │
│                                                             │
│  STEP 2: START MONGODB                                     │
│  ├─ Open PowerShell as Administrator                       │
│  ├─ Run: mongod                                            │
│  └─ See: "Listening on port 27017" ✓                       │
│                                                             │
│  STEP 3: VERIFY CONNECTION                                 │
│  ├─ Open another PowerShell                                │
│  ├─ Run: mongosh                                           │
│  └─ Run: use library_management                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Commands Quick Reference

### PowerShell Commands (Copy & Paste)

#### 1️⃣ Download MongoDB
```powershell
# Visit this link in browser:
https://www.mongodb.com/try/download/community
# Then run the installer
```

#### 2️⃣ Verify Installation
```powershell
mongod --version
```

#### 3️⃣ Start MongoDB Service
```powershell
# Option A: Start Windows Service (Recommended)
Start-Service MongoDB

# Option B: Start from command line
mongod
```

#### 4️⃣ Connect to MongoDB
```powershell
mongosh
```

#### 5️⃣ Test Database
```powershell
# In mongosh terminal, run:
use library_management
db.version()
show collections
```

#### 6️⃣ Exit MongoDB Shell
```powershell
exit
```

---

## 🚀 Running Your Application

### Terminal Window 1: MongoDB
```powershell
mongod
# Leave this running ✓
```

### Terminal Window 2: Backend Server
```powershell
cd server
npm run dev
# Should show: ✓ Connected to MongoDB successfully
```

### Terminal Window 3: Frontend
```powershell
cd app
npm run dev
# Should show: Local: http://localhost:3001/
```

### Browser
```
http://localhost:3001
```

---

## ✅ How to Know Everything is Working

### Check 1: MongoDB Running
```powershell
mongosh
# If connects without error → ✓ Working
exit
```

### Check 2: Backend Connected
Look for this message in Terminal 2:
```
✓ Server is running on port 5000
✓ Connected to MongoDB successfully
```

### Check 3: API Health
Visit in browser:
```
http://localhost:5000/api/health
```
Should show: `{"status":"ok","message":"Library Management System API is running"}`

### Check 4: Data Saved
After admitting a student, run in PowerShell:
```powershell
mongosh
use library_management
db.students.find()
```
Should show the student you just added ✓

---

## 🆘 Troubleshooting

### Problem: "mongod is not recognized"
```powershell
# MongoDB not in PATH
# Solution: Reinstall MongoDB, check "Add to PATH" option
```

### Problem: "Port 27017 already in use"
```powershell
# Another MongoDB is running
# Solution: Close other terminals or restart computer
```

### Problem: Backend shows "⚠ MongoDB connection failed"
```powershell
# Ensure Terminal 1 (mongod) is running
# Backend will auto-retry every 5 seconds
# Wait for green checkmark: ✓ Connected to MongoDB successfully
```

### Problem: "Cannot connect to server" on admission form
```powershell
# Check all 3 services running:
# - Terminal 1: mongod (MongoDB)
# - Terminal 2: npm run dev (Backend on :5000)
# - Terminal 3: npm run dev (Frontend on :3001)
```

---

## 📁 Database Structure

After MongoDB is set up, it will automatically create:

```
library_management (Database)
├── students (Collection)
│   └── Student records with admission info
├── fees (Collection)
│   └── Payment records
├── seats (Collection)
│   └── Seat assignments
└── requests (Collection)
    └── Student requests
```

---

## 🔗 Configuration File

Your config is in: `server/.env`

```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
FIREBASE_PROJECT_ID=galaxy-library-bcebe
```

**For Remote MongoDB (Atlas):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/library_management?retryWrites=true&w=majority
```

---

## 🎓 Understanding the Flow

```
User fills admission form
        ↓
Frontend sends to Backend (http://localhost:5000)
        ↓
Backend receives request
        ↓
Backend saves to MongoDB (http://localhost:27017)
        ↓
MongoDB stores data
        ↓
Backend returns response ✓
        ↓
Frontend shows success message
```

---

## 📊 Data Example

When you admit a student, MongoDB stores:

```javascript
// Students Collection
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "studentId": "STU1234",
  "fatherName": "Father Name",
  "course": "10th",
  "seatNumber": "A1",
  "mobile": "9876543210",
  "email": "john@example.com",
  "feeAmount": 50000,
  "paymentMode": "cash",
  "createdAt": ISODate("2026-05-28T10:30:00Z"),
  "updatedAt": ISODate("2026-05-28T10:30:00Z")
}

// Fees Collection
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "studentId": ObjectId("507f1f77bcf86cd799439011"),
  "studentDisplayId": "STU1234",
  "studentName": "John Doe",
  "amount": 50000,
  "month": "May 2026",
  "paymentMode": "cash",
  "notes": "Admission fee for 10th course",
  "createdAt": ISODate("2026-05-28T10:30:00Z")
}
```

---

## ✨ You're Ready!

Once MongoDB is installed and running:

1. ✓ Admission data saves permanently
2. ✓ Fees are tracked
3. ✓ Seat assignments recorded
4. ✓ Dashboard shows real statistics
5. ✓ No data loss on refresh

**Next Step:** Go through steps in **DATABASE_SETUP.md** in your project root for detailed instructions.

