# MongoDB Setup - Commands Only (Copy & Paste)

## ⬇️ STEP 1: INSTALL MONGODB

### Download & Install (Windows)
1. Visit: https://www.mongodb.com/try/download/community
2. Select: Windows, Community Edition
3. Download the .MSI file
4. Run installer and follow wizard (check "Install as Service")

---

## ✅ STEP 2: VERIFY INSTALLATION

### Open PowerShell and run:
```powershell
mongod --version
```

**Expected output should show version like:**
```
db version v6.0.0
```

---

## 🚀 STEP 3: START MONGODB

### Option A: Start Windows Service (Recommended)
```powershell
# Open PowerShell as Administrator and run:
Start-Service MongoDB

# Verify it's running:
Get-Service MongoDB
```

**Expected output:**
```
Status   Name     DisplayName
------   ----     -----------
Running  MongoDB  MongoDB
```

### Option B: Start MongoDB Manually
```powershell
# Open new PowerShell and run:
mongod
```

**Expected output (will show something like):**
```
"msg":"Listening on port 27017"
```

**Keep this window open!** ✓

---

## 🔗 STEP 4: TEST CONNECTION

### Open new PowerShell and run:
```powershell
mongosh
```

**Expected output (will connect):**
```
test>
```

### Inside mongosh, run:
```javascript
use library_management
db.version()
```

**Expected output:**
```
'6.0.0'
```

### Exit mongosh:
```
exit
```

---

## 🎯 STEP 5: START YOUR APPLICATION

### Open 3 separate PowerShell windows

#### Window 1: Keep MongoDB Running
```powershell
mongod
```
✓ Keep this open - don't close!

#### Window 2: Start Backend Server
```powershell
cd server
npm run dev
```

**Wait for this message:**
```
✓ Server is running on port 5000
✓ Connected to MongoDB successfully
```

#### Window 3: Start Frontend
```powershell
cd app
npm run dev
```

**Wait for this message:**
```
Local: http://localhost:3001/
```

---

## 🌐 STEP 6: TEST IN BROWSER

Open browser and go to:
```
http://localhost:3001
```

Click "New Admission" and fill the form. ✓

---

## ✨ STEP 7: VERIFY DATA SAVED

### Open new PowerShell:
```powershell
mongosh
use library_management
db.students.find()
```

**Should show the student you just added!** ✓

---

## 🆘 IF ERRORS OCCUR

### Error: "mongod is not recognized"
```powershell
# Reinstall MongoDB from:
# https://www.mongodb.com/try/download/community
```

### Error: "Port 27017 already in use"
```powershell
# Close other mongod instances
# Or restart your computer
```

### Error: "Cannot connect to MongoDB"
```powershell
# Make sure Window 1 (mongod) is running
# Check: Get-Service MongoDB
# If not running: Start-Service MongoDB
```

### Error: "Failed to process admission: Network Error"
```powershell
# Make sure all 3 windows are running:
# Window 1: mongod ✓
# Window 2: npm run dev (backend) ✓
# Window 3: npm run dev (app) ✓
```

---

## 📝 .ENV FILE (Already configured)

Your config file: `server/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
FIREBASE_PROJECT_ID=galaxy-library-bcebe
```

**This is already correct. No need to change!** ✓

---

## 🎓 UNDERSTANDING THE SETUP

```
Frontend (Port 3001)
      ↓ (sends form data)
Backend (Port 5000)
      ↓ (saves data)
MongoDB (Port 27017)
      ↓ (stores data)
Database: library_management
```

All three must be running together!

---

## ⚡ QUICK CHECKLIST

- [ ] MongoDB installed? → Run: `mongod --version`
- [ ] MongoDB running? → Run: `mongosh` (should connect)
- [ ] Backend running? → Should show: `✓ Connected to MongoDB successfully`
- [ ] Frontend running? → Should show: `Local: http://localhost:3001/`
- [ ] Admission form works? → Fill and submit
- [ ] Data saved? → Run: `mongosh` then `use library_management` then `db.students.find()`

---

## 🎉 YOU'RE DONE!

When all steps are complete, you can:
✓ Add students with admission form
✓ Data saves to MongoDB permanently
✓ Fees tracked automatically
✓ Seats assigned
✓ Dashboard shows statistics

**Everything works!** 🚀

