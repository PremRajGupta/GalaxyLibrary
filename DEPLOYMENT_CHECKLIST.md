# 🚀 Deployment & Setup Checklist

## 📋 Pre-Setup Requirements

- [ ] Node.js 16+ installed
- [ ] MongoDB 4.0+ running
- [ ] npm packages installed: `cd server && npm install`
- [ ] Firebase project setup
- [ ] Cloudinary account created
- [ ] Redis installed (optional but recommended)

---

## 🔧 Environment Setup

### Step 1: Create/Update `.env` File

Location: `server/.env`

```bash
# Database
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=galaxy-library-bcebe

# Cloudinary (Image Storage)
CLOUDINARY_NAME=your_cloud_name          ← Get from Cloudinary
CLOUDINARY_API_KEY=your_api_key          ← Get from Cloudinary
CLOUDINARY_API_SECRET=your_api_secret    ← Get from Cloudinary
CLOUDINARY_UPLOAD_PRESET=preset_name     ← Create in Cloudinary dashboard

# Redis (Caching - Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your_very_secret_jwt_key_12345

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 2: Get Cloudinary Credentials

1. Visit: https://cloudinary.com/users/register/free
2. Sign up (free tier)
3. Go to Dashboard → Settings
4. Copy:
   - Cloud Name
   - API Key
   - API Secret
5. Create Upload Preset:
   - Settings → Upload → Add upload preset
   - Name: `library_management`
   - Unsigned: Yes (for easier setup)

---

## 🗄️ Database Setup

### MongoDB Local Setup

```powershell
# Start MongoDB
mongod

# (Or as service on Windows)
Start-Service MongoDB

# Verify running
mongosh
# Should show: "MongoShell version ..."
```

### MongoDB Atlas (Cloud) Setup

```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Copy connection string
5. Replace MONGODB_URI in .env with: mongodb+srv://username:password@cluster.mongodb.net/library_management
```

---

## ⚡ Redis Setup (Optional but Recommended)

### Windows Installation

```powershell
# Using Chocolatey
choco install redis-64

# Start service
Start-Service Redis

# Or manual start
redis-server
```

### Verify Redis Running

```powershell
redis-cli ping
# Response: PONG
```

---

## 🚀 Application Startup

### Terminal 1: MongoDB

```powershell
mongod
# Should show: "Listening on port 27017"
```

### Terminal 2: Redis (Optional)

```powershell
redis-server
# Should show: "Ready to accept connections"
```

### Terminal 3: Backend API

```powershell
cd server
npm install              # First time only
npm run dev

# Expected output:
# ✓ Server is running on port 5000
# ✓ Connected to MongoDB successfully
# ✓ Redis cache connected
```

### Terminal 4: Frontend

```powershell
cd app
npm install              # First time only
npm run dev

# Expected output:
# ✓ Local: http://localhost:5173/
```

---

## ✅ Verification Checklist

### Backend Server (Port 5000)

- [ ] Check health: `curl http://localhost:5000/api/health`
  - Expected: `{"status":"ok",...}`

- [ ] Check database: `curl http://localhost:5000/api/v1/branches` 
  - (Should return empty array initially, not error)

### Frontend (Port 5173)

- [ ] Open browser: `http://localhost:5173`
- [ ] Should load without 404 errors
- [ ] Can login with Firebase credentials
- [ ] Can navigate to different pages

### Database

```
mongosh
use library_management
show collections
# Should show: students, fees, seats, requests, organizations, branches, apiKeys
```

---

## 🎯 API Endpoints Overview

### Students (Multi-Branch)
```
GET    /api/v1/students                 - List all students
POST   /api/v1/students                 - Create student
GET    /api/v1/students/:id             - Get student
PUT    /api/v1/students/:id             - Update student
DELETE /api/v1/students/:id             - Delete student
```

### Branches
```
GET    /api/v1/branches                 - List branches
POST   /api/v1/branches                 - Create branch
GET    /api/v1/branches/:branchId       - Get branch
PUT    /api/v1/branches/:branchId       - Update branch
DELETE /api/v1/branches/:branchId       - Delete branch
GET    /api/v1/branches/:branchId/stats - Branch statistics
```

### Image Upload
```
POST   /api/v1/upload                   - Upload image
POST   /api/v1/upload/student-photo     - Upload student photo
POST   /api/v1/upload/documents         - Upload documents
GET    /api/v1/upload/optimized         - Get optimized URL
DELETE /api/v1/upload                   - Delete image
```

---

## 🌍 Multi-Branch Testing

### Create First Organization

```bash
# Insert via MongoDB
mongosh
use library_management
db.organizations.insertOne({
  organizationId: "test-org-001",
  name: "Test Organization",
  email: "admin@test.com",
  status: "active",
  subscriptionPlan: "professional",
  maxBranches: 10
})
```

### Create First Branch

```bash
db.branches.insertOne({
  branchId: "test-branch-001",
  organizationId: "test-org-001",
  name: "Main Branch",
  address: "123 Test St",
  city: "Test City",
  status: "active",
  totalSeats: 100
})
```

### Create API Key

```bash
db.apikeys.insertOne({
  apiKey: "sk_live_test_web_001",
  organizationId: "test-org-001",
  clientType: "web",
  rateLimit: 1000,
  isActive: true
})
```

### Test with API Key

```bash
curl -H "x-api-key: sk_live_test_web_001" \
  http://localhost:5000/api/v1/branches

# Should return branches for test-org-001
```

---

## 📱 Mobile App Setup

### For iOS/Android

1. **Get API Key:**
   ```bash
   # In MongoDB, create mobile API key
   db.apikeys.insertOne({
     apiKey: "sk_live_mobile_ios_001",
     organizationId: "test-org-001",
     clientType: "mobile_ios",
     rateLimit: 500,
     isActive: true
   })
   ```

2. **Update App Config:**
   - Edit: `app/src/lib/api.ts`
   - Add API key header:
   ```typescript
   api.defaults.headers['x-api-key'] = 'sk_live_mobile_ios_001';
   ```

3. **Build for Mobile:**
   ```bash
   # For iOS
   npm run build:ios
   
   # For Android
   npm run build:android
   ```

---

## 🔐 Production Deployment

### Before Going Live

- [ ] Change all passwords & secrets
- [ ] Update MONGODB_URI to Atlas cluster
- [ ] Set NODE_ENV=production
- [ ] Generate strong JWT_SECRET
- [ ] Create API keys for each client
- [ ] Setup SSL/HTTPS certificate
- [ ] Configure DNS records
- [ ] Enable database backups
- [ ] Setup error logging (Sentry)
- [ ] Configure monitoring (New Relic)

### Deploy Backend

**Option A: Railway (Recommended)**
```
1. Push code to GitHub
2. Connect GitHub to Railway
3. Set environment variables
4. Deploy automatically on push
```

**Option B: Render**
```
1. Go to https://render.com
2. Connect GitHub
3. Create Web Service
4. Set environment variables
5. Deploy
```

**Option C: Heroku**
```
1. Go to https://www.heroku.com
2. Create app
3. Connect GitHub
4. Deploy
```

### Deploy Frontend

**Option A: Vercel (Recommended)**
```
1. Go to https://vercel.com
2. Import GitHub project
3. Set environment variables
4. Deploy automatically
```

**Option B: Netlify**
```
1. Go to https://netlify.com
2. Import GitHub project
3. Build command: npm run build
4. Publish directory: dist
5. Deploy
```

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Backend logs
tail -f server/logs/server.log

# MongoDB logs
mongod --logpath ./mongodb.log --logappend

# Check service health
curl http://localhost:5000/api/health
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| CORS errors | Add frontend URL to ALLOWED_ORIGINS in server.js |
| Cannot upload images | Check Cloudinary credentials & upload preset |
| Slow API responses | Enable Redis caching, check database indexes |
| Rate limit exceeded | Wait 15 min or increase limit for API key |
| Images not loading | Verify Cloudinary URL & public ID format |

---

## 📊 Database Optimization

### Verify Indexes Created

```bash
mongosh
use library_management
db.students.getIndexes()

# Should show indexes like:
# { "key": { "organizationId": 1, "branchId": 1 } }
# { "key": { "studentId": 1, "organizationId": 1 }, "unique": true }
```

### Performance Tips

```
1. Always filter by branchId in queries
2. Use pagination for large datasets (?limit=20&page=1)
3. Enable Redis caching
4. Compress images before upload
5. Use CDN for static files
```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Backend starts without errors
✅ Frontend loads at http://localhost:5173
✅ Can login with Firebase
✅ Can create students
✅ Can upload images to Cloudinary
✅ Images display correctly
✅ API responds in < 200ms
✅ Database operations are fast

---

## 📞 Support

For issues:
1. Check logs: `npm run dev` terminal output
2. Verify .env file has all variables
3. Ensure MongoDB & Redis are running
4. Check Cloudinary credentials
5. Review error messages carefully
6. Search documentation files

---

## 🚀 Next Steps

1. ✅ Complete this checklist
2. ✅ Test all endpoints
3. ✅ Setup production servers
4. ✅ Deploy to Railway/Vercel
5. ✅ Configure custom domains
6. ✅ Enable SSL/HTTPS
7. ✅ Setup monitoring & alerts
8. ✅ Scale gradually

**You're ready to launch! 🎊**
