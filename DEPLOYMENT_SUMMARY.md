# 🎯 DEPLOYMENT SUMMARY - Galaxy Library

## Your Setup
```
Frontend:  React + TypeScript (Vite) 
Backend:   Node.js + Express
Database:  MongoDB
Hosting:   Vercel + Render + MongoDB Atlas
```

---

## 5 SIMPLE STEPS

### ⭐ Step 1: MongoDB Atlas (5 min)
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create user `admin` with a password → **SAVE PASSWORD**
4. Allow all IPs (0.0.0.0/0)
5. Get connection string: `mongodb+srv://admin:PASSWORD@cluster...`

### ⭐ Step 2: Backend on Render (20 min)
1. Sign up: https://render.com (use GitHub)
2. Create Web Service from your GitHub repo
3. Settings:
   - **Build:** `cd server && npm install`
   - **Start:** `cd server && npm start`
4. Add env variables:
   ```
   MONGODB_URI=mongodb+srv://admin:PASSWORD@...
   FRONTEND_URL=(will update after Vercel)
   JWT_SECRET=random-secret-32-chars-long
   NODE_ENV=production
   CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_PRESET
   FIREBASE_PROJECT_ID=galaxy-library-bcebe
   ```
5. Deploy → wait 3-5 min → **SAVE URL** (e.g., `https://galaxy-library-api.onrender.com`)

### ⭐ Step 3: Frontend on Vercel (15 min)
1. Sign up: https://vercel.com (use GitHub)
2. Import GitHub repo
3. Settings:
   - **Root:** `./app`
   - **Build:** `npm run build`
   - **Output:** `dist`
4. Env variable:
   ```
   VITE_API_URL=https://galaxy-library-api.onrender.com
   ```
5. Deploy → wait 2-3 min → **SAVE URL** (e.g., `https://galaxy-library.vercel.app`)

### ⭐ Step 4: Update Backend CORS
1. Go to Render dashboard
2. Open `galaxy-library-api` service
3. Edit env: `FRONTEND_URL=https://galaxy-library.vercel.app`
4. Save → auto-redeploys

### ⭐ Step 5: TEST!
```bash
# Check backend
curl https://galaxy-library-api.onrender.com/api/students

# Open frontend
https://galaxy-library.vercel.app

# Try logging in and check for errors
```

---

## ENVIRONMENT VARIABLES CHECKLIST

**Render Backend (server/):**
- ✅ MONGODB_URI ← from MongoDB Atlas
- ✅ JWT_SECRET ← generate yourself
- ✅ FRONTEND_URL ← Vercel URL
- ✅ CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_PRESET
- ✅ FIREBASE_PROJECT_ID
- ✅ NODE_ENV=production

**Vercel Frontend (app/):**
- ✅ VITE_API_URL ← Render URL

---

## IMPORTANT NOTES

✅ Your code already has correct API config (`apiConfig.ts` reads `VITE_API_URL`)  
✅ Backend CORS is already configured for production domains  
✅ Both services auto-deploy when you push to GitHub  
✅ First Render startup takes 10+ minutes (free tier)  
✅ Keep MongoDB IP whitelist at 0.0.0.0/0 for cloud deployment  

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| 503 on Render | Wait 10 min, check logs, refresh |
| CORS error | Verify FRONTEND_URL on Render = Vercel domain |
| MongoDB won't connect | Check user:password in URI, IP whitelist |
| Frontend can't reach API | Check VITE_API_URL = Render URL, hard refresh |
| Deployment fails | Check logs, verify GitHub push was successful |

---

## COST (Free Tier)
- Vercel: $0
- Render: $0 (with 15-min inactivity timeout)
- MongoDB: $0 (512MB storage)
- **Total: $0/month** ✨

---

## AFTER DEPLOYMENT
- Monitor logs regularly
- Test all features
- Setup custom domain (optional, later)
- Backup MongoDB regularly
- Update credentials periodically

See [VERCEL_RENDER_DEPLOYMENT.md](VERCEL_RENDER_DEPLOYMENT.md) for detailed guide with all steps.
