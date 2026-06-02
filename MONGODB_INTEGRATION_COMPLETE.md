# ✅ MongoDB Integration - Complete Setup Guide

## 📌 Status: READY TO USE

Your application is **fully configured** with MongoDB! Here's everything that's set up:

### ✅ What's Already Configured:

- **Database**: MongoDB with Mongoose ODM
- **Models**: Student, Fee, Seat, Request (all with proper schemas)
- **Controllers**: All using Mongoose operations (find, save, findByIdAndUpdate, etc.)
- **API**: Frontend connected to backend with authentication
- **Environment**: .env file with MongoDB URI
- **Packages**: Mongoose installed and configured

---

## 🚀 QUICK START (3 Steps to Run)

### Step 1: Install MongoDB (One-time only)
```powershell
# Download from: https://www.mongodb.com/try/download/community
# Or use Chocolatey:
choco install mongodb-community

# Verify installation:
mongod --version
```

### Step 2: Open 3 Terminal Windows

#### **Terminal 1 - MongoDB Server**
```powershell
mongod
# Should show: "Listening on port 27017"
```

#### **Terminal 2 - Backend Server**
```powershell
cd server
npm install  # First time only
npm run dev

# Should show:
# ✓ Server is running on port 5000
# ✓ Connected to MongoDB successfully
```

#### **Terminal 3 - Frontend App**
```powershell
cd app
npm install  # First time only
npm run dev

# Should show:
# Local: http://localhost:5173/
```

### Step 3: Open Browser
```
http://localhost:5173
```

---

## 🗄️ Database Collections (Auto-created)

MongoDB will automatically create these collections when first used:

| Collection | Purpose | Fields |
|-----------|---------|--------|
| **students** | Student records | studentId, name, email, phone, course, seat, fees, status |
| **fees** | Fee payments | studentId, amount, month, paymentMode, paymentDate |
| **seats** | Seat assignments | seatNumber, status (available/occupied/reserved), studentId |
| **requests** | Student requests | studentId, requestType, status, details, requestDate |

---

## 📝 API Endpoints (Working)

### Students
```
GET    /api/students              - Get all students
POST   /api/students              - Create new student
GET    /api/students/:id          - Get student by ID
PUT    /api/students/:id          - Update student
DELETE /api/students/:id          - Delete student
```

### Fees
```
GET    /api/fees                  - Get all fees
POST   /api/fees                  - Create fee entry
```

### Seats
```
GET    /api/seats                 - Get all seats
PUT    /api/seats/:id             - Update seat status
```

### Requests
```
GET    /api/requests              - Get all requests
PUT    /api/requests/:id          - Update request status
```

### Dashboard
```
GET    /api/dashboard/stats       - Get dashboard statistics
```

---

## 🔧 Configuration Files

### Backend Config

**`server/.env`** (Already configured)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
FIREBASE_PROJECT_ID=galaxy-library-bcebe
```

**`server/src/server.js`** (MongoDB connection)
```javascript
// Automatic retry mechanism included
// Connects to MongoDB on startup
// Retries every 5 seconds if connection fails
```

### Frontend Config

**`app/src/lib/api.ts`** (API configuration)
```typescript
baseURL: 'http://localhost:5000/api'
// Includes Firebase authentication interceptor
// 10-second timeout configured
```

---

## ✨ MongoDB Data Examples

### Create a Student
```javascript
{
  "name": "Rahul Kumar",
  "fatherName": "Suresh Kumar",
  "mobile": "9876543210",
  "email": "rahul@example.com",
  "address": "123 Main St",
  "course": "B.Tech CSE",
  "feeAmount": 5000,
  "seatNumber": "A1",
  "timeShift": "morning",
  "paymentMode": "UPI"
}
```

### Record a Fee Payment
```javascript
{
  "studentDisplayId": "STUR2024",
  "amount": 5000,
  "month": "May 2024",
  "paymentMode": "upi",
  "notes": "Full payment received"
}
```

### Update Seat Status
```javascript
{
  "status": "occupied",
  "studentDisplayId": "STUR2024"
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
```powershell
# 1. Check if MongoDB is running
Get-Service MongoDB

# 2. Start MongoDB
Start-Service MongoDB

# 3. Or manually run
mongod
```

### Issue: "Port 5000 already in use"
**Solution:**
```powershell
# Kill the process using port 5000
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Or change PORT in server/.env to different number
PORT=5001
```

### Issue: "MONGODB_URI connection string error"
**Solution:**
```
# Check server/.env has correct format:
MONGODB_URI=mongodb://localhost:27017/library_management

# Port 27017 is MongoDB default
# library_management is the database name
```

### Issue: "Firebase authentication error"
**Solution:**
- Login with valid Firebase credentials
- Check Firebase project ID in .env matches your project
- Verify Firestore rules allow read/write

---

## 📊 Testing the Connection

### Test 1: MongoDB Shell
```powershell
mongosh
> use library_management
> db.students.find()
```

### Test 2: API Health Check
```powershell
curl http://localhost:5000/api/health
# Response: {"status":"ok","message":"Library Management System API is running"}
```

### Test 3: Get All Students
```powershell
# With Bearer token in Authorization header:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/students
```

---

## 🎯 Next Steps

1. ✅ Install MongoDB (if not already done)
2. ✅ Run the 3 terminal commands above
3. ✅ Visit http://localhost:5173 in your browser
4. ✅ Login with Firebase credentials
5. ✅ Start using the application!

---

## 📚 Additional Resources

- **MongoDB Official Docs**: https://docs.mongodb.com/
- **Mongoose Documentation**: https://mongoosejs.com/docs/
- **REST API Testing**: Use Postman or Insomnia
- **Database Viewer**: Use MongoDB Compass (visual tool)

---

## ✅ Everything is Ready!

Your full-stack application with MongoDB is ready to go. Just follow the Quick Start steps above and you're good to go! 🎉
