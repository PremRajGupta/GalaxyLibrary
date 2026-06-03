# 📋 QUICK DEPLOYMENT CHECKLIST

## BEFORE YOU START
- [ ] All code pushed to GitHub (public repo)
- [ ] All `.env` files are in `.gitignore` (don't commit secrets)
- [ ] Backend runs locally: `npm run dev` (in server/)
- [ ] Frontend builds locally: `npm run build` (in app/)

---

## PHASE 1: MONGODB ATLAS (Do First!)
- [ ] Create account at https://www.mongodb.com/cloud/atlas
- [ ] Create Free Cluster (M0 Sandbox)
- [ ] Create Database User (username: admin, copy password)
- [ ] Allow Network Access: 0.0.0.0/0
- [ ] Copy connection string
- [ ] **SAVE:** `MONGODB_URI=mongodb+srv://admin:PASSWORD@...`

---

## PHASE 2: RENDER (Deploy Backend)
- [ ] Create account at https://render.com (use GitHub)
- [ ] Authorize GitHub access
- [ ] Click "New+" → "Web Service"
- [ ] Connect your GitHub repo
- [ ] Set Name: `galaxy-library-api`
- [ ] Set Build Command: `cd server && npm install`
- [ ] Set Start Command: `cd server && npm start`
- [ ] Add Environment Variables:
  - [ ] `MONGODB_URI` (from Phase 1)
  - [ ] `JWT_SECRET` (generate random 32+ chars)
  - [ ] `NODE_ENV=production`
  - [ ] `CLOUDINARY_*` credentials
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FRONTEND_URL` (you'll update this after Vercel)
- [ ] Deploy and wait 3-5 minutes
- [ ] **SAVE:** Backend URL (e.g., `https://galaxy-library-api.onrender.com`)

---

## PHASE 3: VERCEL (Deploy Frontend)
- [ ] Create account at https://vercel.com (use GitHub)
- [ ] Click "Import Git Repository"
- [ ] Select `galaxy-library` repo
- [ ] Set Root Directory: `./app`
- [ ] Set Build Command: `npm run build`
- [ ] Set Output Directory: `dist`
- [ ] Update `VITE_API_URL` in app/.env.production:
  - [ ] `VITE_API_URL=` (Render URL from Phase 2)
- [ ] Deploy and wait 2-3 minutes
- [ ] **SAVE:** Frontend URL (e.g., `https://galaxy-library.vercel.app`)

---

## PHASE 4: UPDATE RENDER WITH VERCEL URL
- [ ] Go to Render → galaxy-library-api → Environment
- [ ] Update `FRONTEND_URL=` with Vercel URL from Phase 3
- [ ] Click "Save"
- [ ] Service auto-redeploys

---

## PHASE 5: TEST EVERYTHING
- [ ] Backend health: `curl https://galaxy-library-api.onrender.com/api/students`
- [ ] Frontend loads: Open Vercel URL in browser
- [ ] Login works: Try creating account
- [ ] API calls work: Check Network tab in DevTools (F12)
- [ ] No CORS errors: If yes, verify FRONTEND_URL on Render

---

## COMMON COMMANDS

### Push to GitHub
```powershell
git add .
git commit -m "Deploy updates"
git push origin main
```

### Check Backend Logs
1. Go to Render dashboard
2. Click galaxy-library-api
3. Scroll to "Logs"

### Check Frontend Logs
1. Go to Vercel dashboard
2. Click deployment
3. Click "Logs"

### Check MongoDB
1. Go to MongoDB Atlas
2. Click Collections to see data
3. Click Activity to see operations

---

## TROUBLESHOOTING

**Backend won't start?**
- Check logs on Render
- Verify MONGODB_URI syntax (has password and no special chars need escaping)
- Ensure `npm start` command works locally

**Frontend can't reach backend?**
- Check VITE_API_URL in app/.env.production (should match Render backend URL)
- Check FRONTEND_URL in Render env vars (should match Vercel frontend URL)
- Hard refresh: Ctrl+Shift+R
- Check browser console errors

**MongoDB won't connect?**
- Verify username:password in URI
- Check IP whitelist (should be 0.0.0.0/0)
- Test connection string locally first

**Render 503 error?**
- Wait 10 minutes (free tier takes time)
- Refresh page
- Check logs for actual error

---

## APPROXIMATE TIMELINE
- Phase 1 (MongoDB): 5-10 min
- Phase 2 (Render): 15-20 min
- Phase 3 (Vercel): 10-15 min
- Phase 4 (Update): 2-3 min
- Phase 5 (Testing): 5-10 min

**Total: ~45-60 minutes**

---

## DON'T FORGET
✅ Use strong JWT_SECRET (32+ random chars)  
✅ Keep Cloudinary credentials safe  
✅ Enable auto-deploy (git push = auto deploy)  
✅ Monitor logs after first deployment  
✅ Test from different browser (no cache issues)  
