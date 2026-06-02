# 🏗️ Scalable Multi-Client Architecture

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS LAYER                               │
├──────────────────┬──────────────────┬──────────────────────────────┤
│   Web Browser    │    Mobile App    │   Other Websites/Systems    │
│  (React/Vite)    │   (iOS/Android)  │   (Third-party API)         │
└────────┬─────────┴────────┬─────────┴──────────────┬──────────────┘
         │                  │                        │
         │   HTTP/HTTPS    │        REST API        │
         │                  │                        │
┌────────▼──────────────────▼────────────────────────▼──────────────┐
│                   API GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  ✓ Rate Limiting (100 req/min per IP)                      │  │
│  │  ✓ Request Validation                                       │  │
│  │  ✓ Authentication (Firebase + JWT)                         │  │
│  │  ✓ CORS Handling (Multiple Domains)                        │  │
│  │  ✓ Request Logging                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────────┐
│              BACKEND API LAYER (Node.js/Express)                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │  Students    │  Fees        │  Seats       │  Branches    │  │
│  │  Endpoints   │  Endpoints   │  Endpoints   │  Endpoints   │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│  ┌──────────────┬──────────────┬──────────────────────────────┐  │
│  │  Caching     │  Image       │  Multi-branch Logic          │  │
│  │  Service     │  Service     │  (Organization/Branch filter)│  │
│  └──────────────┴──────────────┴──────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                       │
┌───▼──────────┐  ┌──────────────┐  ┌─────▼──────────────┐
│   MongoDB    │  │  Redis Cache │  │ Cloudinary/Firebase│
│   Database   │  │  (Sessions)  │  │ (Image Storage)    │
└──────────────┘  └──────────────┘  └────────────────────┘
```

---

## 🎯 Key Features

### 1. ✅ Multiple Websites/Clients
```
API_KEY system for different frontends
┌─ Website 1 (Main Library)    → API_KEY_WEB_001
├─ Website 2 (Branch Library)  → API_KEY_WEB_002
├─ Mobile App (iOS)             → API_KEY_MOBILE_IOS
├─ Mobile App (Android)         → API_KEY_MOBILE_ANDROID
└─ Admin Dashboard              → API_KEY_ADMIN
```

### 2. ✅ Multiple Branches
```
Organization Structure:
┌─ Galaxy Library (HQ)
│  ├─ Branch: Delhi Central
│  ├─ Branch: Delhi West
│  └─ Branch: Delhi South
└─ Star Library (Franchise)
   ├─ Branch: Mumbai Main
   └─ Branch: Mumbai Suburb
```

### 3. ✅ Fast Performance
- **Redis Caching**: Cache frequently accessed data
- **Database Indexing**: Fast queries on common fields
- **API Response Compression**: gzip compression
- **CDN for Images**: Cloudinary delivers optimized images
- **Pagination**: Load data in chunks, not all at once

### 4. ✅ Proper Image Management
```
Image Flow:
Frontend → Cloudinary API → Optimized Image URL
                         ↓
                    Mobile: 500px
                    Tablet: 800px
                    Desktop: 1200px
```

### 5. ✅ Database Optimization
```
Indexes on:
- studentId (unique, fast lookup)
- branchId (filter by branch)
- createdAt (sort by date)
- email (search)
- status (filter active/inactive)
```

### 6. ✅ No Hosting Issues
- **Stateless Backend**: Can scale horizontally
- **Database Connection Pooling**: Reuse connections
- **Error Handling**: Graceful degradation
- **Health Checks**: Monitor server status
- **Logging**: Track issues

---

## 🔧 Database Schema Updates

### Student Model (Multi-branch)
```javascript
{
  _id: ObjectId,
  studentId: "STU-DEL-2024-001",  // Branch-specific ID
  branchId: "branch-delhi-central", // Which branch
  organizationId: "galaxy-lib-001",  // Which organization
  name: "Rahul Kumar",
  email: "rahul@example.com",
  photo: "https://res.cloudinary.com/galaxy-lib/image/upload/v123/student-photo.jpg",
  photoPublicId: "galaxy-lib/student-photo", // For deletion
  seatNumber: "A1",
  feeAmount: 5000,
  status: "active",
  createdAt: 2024-05-28,
  updatedAt: 2024-05-28
}
```

### New Models

**Organization Model:**
```javascript
{
  _id: ObjectId,
  organizationId: "galaxy-lib-001",
  name: "Galaxy Library",
  email: "info@galaxylib.com",
  phone: "9876543210",
  website: "www.galaxylib.com",
  cloudinaryFolder: "galaxy-lib",
  subscriptionPlan: "premium",
  maxBranches: 10,
  maxStudents: 5000,
  createdAt: 2024-05-28
}
```

**Branch Model:**
```javascript
{
  _id: ObjectId,
  branchId: "branch-delhi-central",
  organizationId: "galaxy-lib-001",
  name: "Delhi Central",
  address: "123 Main St, Delhi",
  city: "Delhi",
  phone: "9876543210",
  manager: "Suresh Kumar",
  seats: 100,
  createdAt: 2024-05-28
}
```

**API Key Model:**
```javascript
{
  _id: ObjectId,
  apiKey: "sk_live_abc123def456...",
  organizationId: "galaxy-lib-001",
  clientType: "web", // web, mobile_ios, mobile_android, admin
  rateLimit: 1000, // requests per hour
  isActive: true,
  createdAt: 2024-05-28
}
```

---

## 🌐 API Endpoints - Multi-Client

### Client Authentication
```
POST /api/v1/auth/login
  - Email & Password OR
  - API Key for mobile/systems

Response:
{
  token: "eyJhbGc...",
  organizationId: "galaxy-lib-001",
  branchId: "branch-delhi-central",
  userRole: "admin"
}
```

### Students (Multi-branch)
```
GET    /api/v1/students                 - Get branch students (paginated)
  Query: ?branch=branch-delhi-central&page=1&limit=20&sort=-createdAt

GET    /api/v1/students/:id             - Get specific student
POST   /api/v1/students                 - Create (auto-adds branchId)
PUT    /api/v1/students/:id             - Update
DELETE /api/v1/students/:id             - Delete
```

### Branches
```
GET    /api/v1/branches                 - Get all branches of organization
GET    /api/v1/branches/:branchId       - Get branch details
POST   /api/v1/branches                 - Create new branch (admin only)
PUT    /api/v1/branches/:branchId       - Update branch
```

### Image Upload (Cloudinary)
```
POST /api/v1/upload
  Body: {
    file: <image file>,
    type: "student_photo" | "document"
  }
  Response: {
    url: "https://res.cloudinary.com/.../student-photo.jpg",
    publicId: "organization/folder/image-name"
  }

DELETE /api/v1/upload/:publicId
  - Deletes image from Cloudinary
```

### Dashboard (Per-Branch)
```
GET /api/v1/dashboard/stats?branch=branch-id
  Response: {
    totalStudents: 250,
    activeStudents: 200,
    totalFees: 1250000,
    occupiedSeats: 85,
    availableSeats: 15
  }
```

---

## 📱 Mobile-Friendly Endpoints

### Optimize for Mobile
```
GET /api/v1/students/light?branch=branch-id
Response: Minimal fields (id, name, photo URL only)

GET /api/v1/fees/summary?student_id=STU123&limit=5
Response: Last 5 fees (not all)

POST /api/v1/upload/photo
  - Auto-resize to 500px
  - Compress to <100KB
  - Return optimized URL
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Hosting Layer                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Vercel / Netlify (Frontend CDN)               │  │
│  │  - React/Vite app                             │  │
│  │  - Auto-deploy on push                        │  │
│  │  - Global CDN for fast delivery                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Railway / Render (Backend API)                │  │
│  │  - Node.js/Express server                     │  │
│  │  - Auto-scale based on load                   │  │
│  │  - PostgreSQL backup connection              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  MongoDB Atlas (Cloud Database)                │  │
│  │  - Automatic backups                          │  │
│  │  - Replication & failover                     │  │
│  │  - Connection pooling                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Cloudinary (Image Storage & CDN)              │  │
│  │  - Optimized image delivery                    │  │
│  │  - Auto-resize for different devices          │  │
│  │  - Caching & compression                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Implementation

### API Key Management
```javascript
// Header for authenticated requests
Authorization: "Bearer sk_live_abc123..."

// Rate limiting per API key
- Free tier: 100 req/min
- Pro tier: 1000 req/min
- Enterprise: Unlimited
```

### CORS Configuration
```javascript
ALLOWED_ORIGINS: [
  "https://galaxylib.com",
  "https://app.galaxylib.com",
  "https://admin.galaxylib.com",
  "https://starlib.com",
  // Mobile apps use API key auth
]
```

---

## 📊 Performance Metrics

### Expected Performance
```
Frontend Load Time:      < 2 seconds
API Response Time:       < 200ms
Image Load Time:         < 500ms (CDN)
Database Query:          < 50ms (with indexes)
Cache Hit Rate:          > 80%
Server Uptime:           99.9%
```

---

## 💾 Caching Strategy

```
┌─ Redis Cache ─────────────────────┐
│ Key: "branch:branch-id:stats"     │
│ TTL: 5 minutes                    │
│ Store: Dashboard statistics       │
│ Miss Action: Query DB, cache      │
│                                   │
│ Key: "student:STU123"             │
│ TTL: 10 minutes                   │
│ Store: Student details            │
│ Invalidate on: Update/Delete      │
│                                   │
│ Key: "fees:branch-id:month:2024"  │
│ TTL: 30 days                      │
│ Store: Fee summary                │
│ Invalidate on: New entry          │
└───────────────────────────────────┘
```

---

## 🌍 Multi-Tenant Data Isolation

### Automatic Branch Filtering
```javascript
// Middleware adds branchId to all requests
app.use((req, res, next) => {
  // From JWT or API key
  req.branchId = "branch-delhi-central";
  req.organizationId = "galaxy-lib-001";
  next();
});

// All queries automatically filtered
db.Students.find({ branchId: req.branchId })
```

---

## ✅ Checklist for Production

- [ ] API keys created for all clients
- [ ] Cloudinary account setup with folders
- [ ] MongoDB Atlas cluster with backups
- [ ] Redis cache configured
- [ ] Rate limiting enabled
- [ ] CORS configured for all domains
- [ ] SSL/HTTPS enabled
- [ ] Database indexes created
- [ ] Monitoring & logging setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Backup strategy tested

---

## 🎯 Phase-wise Implementation

### Phase 1 (Week 1): Core Architecture
- ✅ Add branchId to models
- ✅ Create Organization & Branch models
- ✅ Implement API key authentication
- ✅ Add multi-branch filtering to endpoints

### Phase 2 (Week 2): Image Optimization
- ✅ Cloudinary integration
- ✅ Image upload API
- ✅ Mobile-optimized image delivery

### Phase 3 (Week 3): Performance
- ✅ Database indexing
- ✅ Redis caching
- ✅ Rate limiting

### Phase 4 (Week 4): Deployment
- ✅ Setup production servers
- ✅ Configure MongoDB Atlas
- ✅ SSL certificates
- ✅ Monitoring & alerts

---

This architecture scales to:
- ✅ Unlimited websites (different API keys)
- ✅ Multiple branches per organization
- ✅ Millions of records (with indexing)
- ✅ Mobile & web apps simultaneously
- ✅ Lightning-fast responses (caching)
- ✅ Zero downtime deployment
