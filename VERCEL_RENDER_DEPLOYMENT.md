# 🚀 Complete Deployment Guide: Vercel + Render + MongoDB Atlas

## Architecture Overview
```
┌──────────────────────────────────────────────────────────┐
│  VERCEL (Frontend)                                       │
│  ├─ React + TypeScript + Vite                           │
│  └─ Runs at: https://your-app.vercel.app                 │
│                                                          │
│  ↓ API Calls                                             │
│                                                          │
│  RENDER (Backend)                                        │
│  ├─ Node.js + Express                                   │
│  └─ Runs at: https://your-api.onrender.com              │
│                                                          │
│  ↓ Queries                                               │
│                                                          │
│  MONGODB ATLAS (Database)                                │
│  ├─ Cloud MongoDB                                       │
│  └─ Connection: mongodb+srv://user:pass@cluster...     │
└──────────────────────────────────────────────────────────┘
```

---

## PHASE 1: MONGODB ATLAS SETUP (⏱️ 5-10 minutes)

### Step 1: Create MongoDB Atlas Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Sign Up"
3. Create account with email/password or Google
4. Verify email

### Step 2: Create a Cluster
1. After login, click "Create"
2. Choose **Free Tier** (M0 Sandbox)
3. Select your region (e.g., `ap-south-1` for India)
4. Click "Create Cluster"
5. Wait 2-3 minutes for cluster to provision

### Step 3: Create Database User
1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username: `admin` (or your choice)
5. Generate password: Click "Autogenerate Secure Password"
6. **COPY THIS PASSWORD** - you'll need it
7. Click "Add User"

### Step 4: Setup Network Access
1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note:** This is safe for now; later restrict to Render's IP
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Databases" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Drivers" (not MongoDB Compass)
4. Select "Node.js" driver
5. Copy the connection string
6. **Replace:**
   - `<username>` with `admin`
   - `<password>` with the password you copied earlier
   - `library_management` for database name

**Example:**
```
mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/library_management?retryWrites=true&w=majority
```

---

## PHASE 2: BACKEND SETUP ON RENDER (⏱️ 15-20 minutes)

### Step 1: Prepare Backend for Production
1. In `server/` folder, create `.env.production` (for reference)
2. Update [server/src/server.js](server/src/server.js) CORS for production domains:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-vercel-app.vercel.app',  // Add your Vercel domain
  process.env.FRONTEND_URL
].filter(Boolean);
```

### Step 2: Ensure server.js has proper port binding
Check [server/src/server.js](server/src/server.js) has:
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Create GitHub Repository
1. Go to: https://github.com/new
2. Create public repository: `galaxy-library` (or your choice)
3. Initialize with:
   ```bash
   cd "e:\PROGRAM\AntiGravity\Galaxy Library"
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/galaxy-library.git
   git push -u origin main
   ```

### Step 4: Create Render Account & Deploy Backend
1. Go to: https://render.com
2. Click "Sign Up" (use GitHub)
3. Authorize GitHub access
4. Click "New+" → "Web Service"
5. Connect your GitHub repo
6. Fill deployment form:

   | Field | Value |
   |-------|-------|
   | Name | `galaxy-library-api` |
   | Environment | `Node` |
   | Build Command | `cd server && npm install` |
   | Start Command | `cd server && npm start` |
   | Runtime | `Node 18` |

7. Scroll to "Environment" → Add these variables:

   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/library_management?retryWrites=true&w=majority
   FRONTEND_URL=https://your-app.vercel.app
   JWT_SECRET=your-very-secret-key-change-this-32-chars
   
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_UPLOAD_PRESET=library_management
   
   FIREBASE_PROJECT_ID=galaxy-library-bcebe
   ```

8. Click "Deploy"
9. Wait for deployment (~3-5 minutes)
10. Copy your Render URL: `https://galaxy-library-api.onrender.com`

---

## PHASE 3: FRONTEND SETUP ON VERCEL (⏱️ 10-15 minutes)

### Step 1: Update Frontend Environment
1. Update [app/.env.production](app/.env.production):

```
VITE_API_URL=https://galaxy-library-api.onrender.com
```

**Note:** Your `app/src/lib/apiConfig.ts` already reads from `VITE_API_URL`, so no code changes needed.

### Step 2: Create Vercel Account & Deploy Frontend
1. Go to: https://vercel.com
2. Click "Sign Up" (use GitHub)
3. Click "Import Git Repository"
4. Select `galaxy-library` repo
5. Fill deployment settings:

   | Field | Value |
   |-------|-------|
   | Project Name | `galaxy-library` |
   | Framework | `Vite` |
   | Root Directory | `./app` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

6. Add Environment Variables:

   ```
   VITE_API_URL=https://galaxy-library-api.onrender.com
   ```

7. Click "Deploy"
8. Wait for deployment (~2-3 minutes)
9. Get your Vercel URL: `https://galaxy-library.vercel.app`

### Step 3: Update Backend CORS
1. Go to Render dashboard
2. Open `galaxy-library-api` service
3. Click "Environment"
4. Update `FRONTEND_URL=https://galaxy-library.vercel.app`
5. Click "Save"
6. Service will auto-redeploy

---

## PHASE 4: POST-DEPLOYMENT TESTING (⏱️ 5-10 minutes)

### Test Backend Health
```bash
curl https://galaxy-library-api.onrender.com/api/students
# Should return JSON (or auth error, which is fine)
```

### Test Frontend
1. Open: https://galaxy-library.vercel.app
2. Try to login
3. Check Browser Console (F12) for API errors
4. If you see CORS errors, verify FRONTEND_URL on Render

### Common Issues

**Problem:** 503 Service Unavailable on Render
- **Solution:** Wait 5-10 minutes, then refresh. Render's free tier takes time to start.

**Problem:** CORS errors in frontend
- **Solution:** 
  1. Check Render's FRONTEND_URL exactly matches Vercel domain
  2. Hard refresh browser (Ctrl+Shift+R)
  3. Check Network tab in DevTools

**Problem:** MongoDB connection fails
- **Solution:**
  1. Check MONGODB_URI has correct username/password
  2. Verify colon `:` between username and password
  3. Check IP whitelist in MongoDB Atlas (0.0.0.0/0)

---

## PHASE 5: CUSTOM DOMAIN SETUP (Optional, ⏱️ 15-20 minutes)

### For Vercel (Frontend)
1. Go to Vercel dashboard → Settings → Domains
2. Enter: `app.galaxylib.com`
3. Add DNS records shown by Vercel
4. Wait 24-48 hours for DNS propagation

### For Render (Backend)
1. Go to Render dashboard → Web Service → Settings → Custom Domain
2. Enter: `api.galaxylib.com`
3. Add CNAME record to your DNS provider
4. Wait 24-48 hours for DNS propagation

### Update Frontend After Custom Domain
1. Update `VITE_API_URL=https://api.galaxylib.com` in `app/.env.production`
2. Git push to trigger Vercel redeploy

---

## QUICK REFERENCE: Environment Variables

### Render (Backend) - server/.env
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/library_management
FRONTEND_URL=https://galaxy-library.vercel.app
JWT_SECRET=your-secret-key-min-32-chars
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=library_management
FIREBASE_PROJECT_ID=galaxy-library-bcebe
```

### Vercel (Frontend) - app/.env.production
```
VITE_API_URL=https://galaxy-library-api.onrender.com
```

---

## Monitoring & Maintenance

### Check Logs
- **Vercel:** Dashboard → Deployments → Click deployment → Logs
- **Render:** Dashboard → Web Service → Logs (bottom)
- **MongoDB Atlas:** Activity Feed in sidebar

### Restart Services
- **Render:** Settings → Manual Restart
- **Vercel:** Redeploy from dashboard
- **MongoDB:** Auto-managed by Atlas

### Auto-Deploy on Code Push
1. Both Vercel and Render auto-deploy on git push to main
2. Monitor deployment status in dashboard
3. Rollback if needed from deployment history

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel | 3 deployments/day, 100GB bandwidth | $0/month |
| Render | 1 web service, limited uptime | $0/month* |
| MongoDB Atlas | M0 Sandbox (512MB storage, 0.5GB RAM) | $0/month |

**Note:** Render free tier has 15-minute inactivity timeout.

---

## Next Steps

After successful deployment:

1. ✅ Test all features on production
2. ✅ Set up monitoring alerts
3. ✅ Enable HTTPS everywhere (auto with Vercel/Render)
4. ✅ Add custom domain (optional)
5. ✅ Setup backup strategy for MongoDB
6. ✅ Monitor costs as usage grows

---

## Troubleshooting Checklist

- [ ] MongoDB Atlas credentials are correct (username:password)
- [ ] MongoDB IP whitelist includes 0.0.0.0/0 or Render's IP
- [ ] FRONTEND_URL on Render matches Vercel domain exactly
- [ ] VITE_API_BASE_URL on Vercel matches Render domain exactly
- [ ] JWT_SECRET is set and same on backend
- [ ] All Cloudinary credentials are filled
- [ ] Firebase project ID is correct
- [ ] Git repository is public on GitHub
- [ ] Environment variables have no extra spaces
- [ ] Browser cache cleared after deployment

---

**Need help?** Check the logs or refer to [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
