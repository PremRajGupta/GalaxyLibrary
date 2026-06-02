# MongoDB Compass - GUI Setup Guide

## 📥 Install MongoDB Compass

### Method 1: Download & Install (Recommended)
1. Go to: https://www.mongodb.com/products/tools/compass
2. Click **Download**
3. Select **Windows** (or your OS)
4. Run the installer (.msi file)
5. Follow installation wizard and click **Install**
6. Compass will launch automatically after installation

### Method 2: Using Chocolatey
```powershell
choco install mongodb-compass
```

### Method 3: Using winget
```powershell
winget install MongoDB.Compass
```

---

## 🔌 Connect to Your Local MongoDB

### Step 1: Make sure MongoDB is Running
```powershell
mongod
# Terminal should show: "Listening on port 27017"
```

### Step 2: Open MongoDB Compass
- Launch MongoDB Compass from Start Menu
- Or run: `MongoDBCompass.exe`

### Step 3: Connect to Local Server

**Connection String (already filled by default):**
```
mongodb://localhost:27017
```

**Or manually:**
1. Leave all fields at default
2. **Hostname**: `localhost`
3. **Port**: `27017`
4. Click **Connect** button

### ✅ Success!
You should see:
```
✓ Connected to MongoDB Compass
✓ Database: library_management
```

---

## 🎯 Using MongoDB Compass - Step by Step

### View Your Database

1. **Left Sidebar** → Click **library_management**
   ```
   ├── library_management (database)
   │   ├── students
   │   ├── fees
   │   ├── seats
   │   └── requests
   ```

2. **Click a Collection** (e.g., `students`)
   - All student records appear as JSON documents

### 📋 View Documents

**See all students:**
```
Click: library_management > students
```

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│ Collection: students                    │
├─────────────────────────────────────────┤
│ Document 1: Rahul Kumar                 │
│ ├─ _id: 507f1f77bcf86cd799439011      │
│ ├─ studentId: "STUR2024"               │
│ ├─ name: "Rahul Kumar"                 │
│ ├─ email: "rahul@example.com"          │
│ └─ feeAmount: 5000                     │
├─────────────────────────────────────────┤
│ Document 2: Priya Singh                 │
│ └─ ...                                  │
└─────────────────────────────────────────┘
```

### ➕ Insert a New Document

1. **Click Green "+" button** next to collection name
2. **Click "Insert Document"**
3. Enter JSON:
```json
{
  "studentId": "STUR2025",
  "name": "Akshay Sharma",
  "fatherName": "Vijay Sharma",
  "mobile": "9876543210",
  "email": "akshay@example.com",
  "address": "456 Oak Avenue",
  "course": "B.Tech ECE",
  "feeAmount": 5500,
  "seatNumber": "B5",
  "timeShift": "evening",
  "paymentMode": "card"
}
```
4. **Click Insert**

### ✏️ Edit a Document

1. **Click on any document** in the list
2. **Click the pencil icon** (Edit)
3. **Modify the values:**
   ```
   name: "Akshay Sharma" → "Akshay Kumar"
   feeAmount: 5500 → 6000
   ```
4. **Click Update**

### 🗑️ Delete a Document

1. **Right-click on document**
2. **Click "Delete Document"**
3. **Confirm deletion**

---

## 🔍 Filter & Search Documents

### Search by Field

**Example: Find all students with feeAmount > 5000**

1. Click **Filter** button
2. Enter filter:
```json
{
  "feeAmount": { "$gt": 5000 }
}
```
3. Press **Enter**

### Common Filters:

**Find specific student:**
```json
{ "studentId": "STUR2024" }
```

**Find all occupied seats:**
```json
{ "status": "occupied" }
```

**Find fees from specific month:**
```json
{ "month": "May 2024" }
```

**Find pending requests:**
```json
{ "status": "pending" }
```

---

## 📊 View Collection Statistics

**Click on Collection Name** → Right panel shows:
- **Document Count**: Total documents
- **Average Size**: Average document size
- **Index Count**: Database indexes
- **Last Updated**: When last modified

---

## 🛠️ Advanced Features

### Create Index (Speed up queries)

1. **Go to collection**
2. **Click "Indexes" tab**
3. **Click "Create Index"**
4. **Add field to index** (e.g., `studentId`)
5. **Click "Create"**

### Export Data

1. **Right-click collection**
2. **Export to JSON**
3. **Save file**

### Import Data

1. **Right-click collection**
2. **Import from JSON**
3. **Select JSON file**
4. **Click Import**

---

## 🖥️ MongoDB Compass Interface - Full Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB COMPASS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ LEFT SIDEBAR              │       MAIN PANEL                    │
│ ├─ Deployment            │       ┌──────────────────────────┐  │
│ │  └─ localhost:27017    │       │ library_management       │  │
│ ├─ Databases             │       │ Database View            │  │
│ │  ├─ library_management │       │ ┌──────────────────────┐ │  │
│ │  │  ├─ students (150)  │◄──────┤│ Collections:         │ │  │
│ │  │  ├─ fees (45)       │       │├─ students           │ │  │
│ │  │  ├─ seats (100)     │       │├─ fees               │ │  │
│ │  │  └─ requests (20)   │       │├─ seats              │ │  │
│ │  └─ admin              │       │└─ requests           │ │  │
│ │                        │       └──────────────────────┘ │  │
│ │                        │                               │  │
│ │                        │  [+ Add Collection]           │  │
│ │                        │  [Search] [Filter] [Export]   │  │
│ └────────────────────────┴──────────────────────────────────┘
│                                                                 │
│ BOTTOM PANEL - Document Editor                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ {                                                             ││
│ │   "_id": "507f1f77bcf86cd799439011",                        ││
│ │   "studentId": "STUR2024",                                  ││
│ │   "name": "Rahul Kumar",                                    ││
│ │   "email": "rahul@example.com",                             ││
│ │   "feeAmount": 5000                                         ││
│ │ }                                                             ││
│ │                                  [Update] [Delete] [Copy]   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Common Tasks in Compass

### Task 1: Add New Student
1. Click: `library_management` → `students`
2. Click: Green **+** button → **Insert Document**
3. Paste JSON with student data
4. Click: **Insert**

### Task 2: Check Fee Payments
1. Click: `library_management` → `fees`
2. Right panel shows all payments
3. Sort by date or amount

### Task 3: Manage Seats
1. Click: `library_management` → `seats`
2. Filter: `{ "status": "available" }`
3. Shows all empty seats

### Task 4: Track Requests
1. Click: `library_management` → `requests`
2. Filter: `{ "status": "pending" }`
3. Shows student requests to approve/reject

---

## 📱 Real-time Monitoring

**Enable Auto-Refresh:**
1. Click **Settings** (gear icon)
2. Enable **Auto-refresh**
3. Set interval (e.g., 5 seconds)
4. Compass auto-updates when data changes

---

## 🔐 Connection Security

For **local development**, use:
```
mongodb://localhost:27017
```

For **remote server**, use:
```
mongodb+srv://username:password@cluster.mongodb.net
```

Get this string from MongoDB Atlas when you deploy online.

---

## 🆘 Troubleshooting

### Issue: "Cannot Connect"
**Solution:**
1. Verify MongoDB is running: `mongod`
2. Check port 27017 is open
3. Try restarting Compass
4. Check firewall isn't blocking port 27017

### Issue: "Connection Refused"
**Solution:**
```powershell
# Start MongoDB service
Start-Service MongoDB

# Or manually start
mongod
```

### Issue: "Authentication Failed"
**Solution:**
- For local development, **no password needed**
- Just use: `mongodb://localhost:27017`
- Leave username & password blank

---

## ✅ Quick Checklist

- [ ] MongoDB installed and running (`mongod`)
- [ ] MongoDB Compass installed
- [ ] Connected to localhost:27017
- [ ] Can see library_management database
- [ ] Can see 4 collections (students, fees, seats, requests)
- [ ] Can insert/edit/delete documents
- [ ] Can filter documents

---

## 🎉 You're All Set!

Now you can:
- ✅ View all your data visually
- ✅ Insert new records without coding
- ✅ Edit & delete documents easily
- ✅ Filter & search data
- ✅ Monitor database in real-time
- ✅ Export/Import data

Happy database managing! 🚀
