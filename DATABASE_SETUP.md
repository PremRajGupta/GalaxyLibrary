# MongoDB Database Setup Guide

## Step 1: Install MongoDB

### Option A: Windows - Using MongoDB Community Edition

#### Method 1: Download & Install
1. Visit: https://www.mongodb.com/try/download/community
2. Select:
   - **Version**: Latest (6.0 or higher)
   - **OS**: Windows
   - **Package**: MSI
3. Click **Download**
4. Run the installer (mongodb-windows-x86_64-*.msi)
5. Follow installation wizard:
   - Accept License
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Click Install

#### Method 2: Using Chocolatey (If installed)
```powershell
choco install mongodb-community
```

#### Method 3: Using Windows Package Manager
```powershell
winget install MongoDB.Server
```

---

## Step 2: Verify Installation

### Check if MongoDB is Installed
```powershell
# Open PowerShell and run:
mongod --version
```

**Expected Output:**
```
db version v6.0.0
...
```

---

## Step 3: Start MongoDB Service

### Option A: As Windows Service (Recommended)
MongoDB was already installed as a service. Just ensure it's running:

```powershell
# Open PowerShell as Administrator and run:
Get-Service MongoDB
```

**Expected Output:**
```
Status   Name               DisplayName
------   ----               -----------
Running  MongoDB            MongoDB
```

If not running, start it:
```powershell
Start-Service MongoDB
```

### Option B: Manual Start (Command Line)
```powershell
# Open new PowerShell terminal and run:
mongod
```

**Expected Output:**
```
{"t":{"$date":"..."},"s":"I","c":"CONTROL","msg":"Listening on port 27017"}
```

---

## Step 4: Verify MongoDB Connection

### Test Connection with MongoDB Shell

#### Install MongoDB Shell (if not included)
```powershell
choco install mongodb-cli
```

#### Connect to MongoDB
```powershell
mongosh
```

**Expected Output:**
```
Current Mongosh Log ID: 623d8d4e4b5e1a2b3c4d5e6f
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh%202.0.0
Using MongoDB:          6.0.0
Using Mongosh:          2.0.0
...
test>
```

### Test Your Application's Database
```javascript
// In mongosh, run:
use library_management
db.version()
```

**Expected Output:**
```
'6.0.0'
```

### Exit MongoDB Shell
```
exit
```

---

## Step 5: Configure Your Application

### Check Current Configuration
Your `.env` file in the `server` folder:

**File:** `server/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
FIREBASE_PROJECT_ID=galaxy-library-bcebe
```

### If MongoDB is on Different Host
Update the URI:

```bash
# For local MongoDB (default)
MONGODB_URI=mongodb://localhost:27017/library_management

# For remote MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/library_management?retryWrites=true&w=majority
```

---

## Step 6: Start Your Application

### Terminal 1: Start MongoDB (Keep Running)
```powershell
# PowerShell - DO NOT CLOSE THIS WINDOW
mongod
```

### Terminal 2: Start Backend Server
```powershell
cd server
npm run dev
```

**Expected Output:**
```
✓ Server is running on port 5000
✓ API available at http://localhost:5000/api
✓ Connected to MongoDB successfully
```

### Terminal 3: Start Frontend
```powershell
cd app
npm run dev
```

**Expected Output:**
```
VITE v7.3.0  ready in 814 ms
Local:   http://localhost:3001/
```

---

## Step 7: Test Database Connection

### Method 1: Check Server Logs
When you start the backend with `npm run dev`, look for:
```
✓ Connected to MongoDB successfully
```

### Method 2: Test via API
Open browser and visit:
```
http://localhost:5000/api/health
```

**Expected JSON Response:**
```json
{
  "status": "ok",
  "message": "Library Management System API is running"
}
```

### Method 3: View Data in MongoDB
```powershell
# Open mongosh
mongosh

# Switch to your database
use library_management

# View all collections
show collections

# View students collection
db.students.find()

# View fees collection
db.fees.find()
```

---

## Step 8: Common Issues & Solutions

### Issue 1: "MongoDB service not found"
**Solution:**
```powershell
# Run PowerShell as Administrator
# Check if service exists
Get-Service MongoDB

# If not exists, start mongod manually
mongod
```

### Issue 2: "Port 27017 already in use"
**Solution:**
```powershell
# Find and kill process using port 27017
netstat -ano | findstr :27017

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or start MongoDB on different port
mongod --port 27018
# Then update .env: MONGODB_URI=mongodb://localhost:27018/library_management
```

### Issue 3: "Connection refused"
**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Check firewall isn't blocking port 27017
3. Verify .env has correct URI
4. Check MongoDB logs for errors

### Issue 4: Backend shows "⚠ MongoDB connection failed"
**Solution:**
1. Ensure `mongod` is running in Terminal 1
2. Wait 5 seconds - backend will auto-retry
3. Check MongoDB is on port 27017
4. Verify database name: `library_management`

---

## Step 9: Database Schema (Auto-created)

Your application uses these collections:

### Students Collection
```javascript
{
  _id: ObjectId,
  name: String,
  studentId: String,
  fatherName: String,
  motherName: String,
  mobile: String,
  parentMobile: String,
  email: String,
  address: String,
  course: String,
  seatNumber: String,
  feeAmount: Number,
  paymentMode: String,
  timeShift: String,
  photo: String (data URL),
  aadharFront: String (data URL),
  aadharBack: String (data URL),
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Fees Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (reference to Student),
  studentDisplayId: String,
  studentName: String,
  amount: Number,
  month: String,
  paymentMode: String,
  notes: String,
  paymentDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Seats Collection
```javascript
{
  _id: ObjectId,
  seatNumber: String,
  status: String (available/occupied),
  studentId: ObjectId,
  studentName: String,
  assignedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Step 10: Backup & Restore (Optional)

### Backup Database
```powershell
# Create backup folder
mkdir backup

# Backup to folder
mongodump --db library_management --out ./backup
```

### Restore Database
```powershell
mongorestore --db library_management ./backup/library_management
```

---

## Complete Startup Sequence

**Follow this order:**

1. **Terminal 1**: Start MongoDB
   ```powershell
   mongod
   ```
   ✓ Wait for: `Listening on port 27017`

2. **Terminal 2**: Start Backend
   ```powershell
   cd server
   npm run dev
   ```
   ✓ Wait for: `✓ Connected to MongoDB successfully`

3. **Terminal 3**: Start Frontend
   ```powershell
   cd app
   npm run dev
   ```
   ✓ Wait for: `Local: http://localhost:3001/`

4. **Browser**: Open Application
   ```
   http://localhost:3001
   ```

---

## Quick Reference Commands

```powershell
# Start MongoDB
mongod

# Connect to MongoDB
mongosh

# Check if MongoDB is running
Get-Service MongoDB

# Restart MongoDB Service
Restart-Service MongoDB

# Stop MongoDB Service
Stop-Service MongoDB

# Check MongoDB logs
mongosh --eval "db.adminCommand({serverStatus:1})"

# Clear all data from database
mongosh --eval "use library_management; db.dropDatabase()"
```

---

## Testing Admission Form After Database Setup

1. ✓ All three services running (MongoDB, Backend, Frontend)
2. Go to: http://localhost:3001/new-admission
3. Fill the form with student details
4. Click "Admit Student"
5. Check MongoDB:
   ```powershell
   mongosh
   use library_management
   db.students.find()  # Should show your new student
   db.fees.find()      # Should show the admission fee
   ```

---

## Troubleshooting Checklist

- [ ] MongoDB installed: `mongod --version`
- [ ] MongoDB running: Check Terminal 1
- [ ] Backend running: Check Terminal 2 (shows port 5000)
- [ ] Frontend running: Check Terminal 3 (shows port 3001)
- [ ] All three services ready before testing
- [ ] Database connection shows in backend logs
- [ ] No error messages in any terminal

**If still having issues, check:**
1. Firewall isn't blocking port 27017
2. Another instance of mongod isn't already running
3. MongoDB service has proper permissions
4. .env file has correct MONGODB_URI

