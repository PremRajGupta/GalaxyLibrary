# Galaxylibrary — Technical Specification

## Component Inventory

### Layout Components

| Component | Source | Reuse |
|-----------|--------|-------|
| Sidebar | Custom | Once — fixed left navigation |
| TopHeader | Custom | Once — welcome + avatar |
| MainLayout | Custom | Once — wraps all pages |

### Reusable Components

| Component | Source | Used On |
|-----------|--------|---------|
| StatCard | Custom | Dashboard |
| QuickActionCard | Custom | Dashboard |
| ExpiryAlertTable | Custom | Dashboard |
| DataTable | shadcn/ui | Seat Matrix, Requests, Student Records |
| StatusBadge | Custom | Multiple pages |
| IconCircle | Custom | Stats cards, Student avatars |

### shadcn/ui Components (Built-in)

- Button
- Input
- Select
- Table
- Badge
- Card
- Avatar
- Label
- Textarea
- Dialog (for modals)

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | /login | Firebase auth login form |
| Dashboard | / | Main dashboard with stats |
| NewAdmission | /admission | Student admission form |
| FeeCollection | /fees | Fee collection interface |
| SeatMap | /seat-map | Visual seat grid |
| SeatMatrix | /seat-matrix | Tabular seat data |
| Requests | /requests | Pending requests |
| StudentRecords | /students | Student database |
| Reports | /reports | Analytics & reports |

## Animation Implementation

| Animation | Library | Implementation | Complexity |
|-----------|---------|----------------|------------|
| Card hover lift | CSS/Tailwind | `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200` | Low |
| Button hover darken | CSS/Tailwind | `hover:brightness-90 transition-colors duration-150` | Low |
| Sidebar menu hover | CSS/Tailwind | `hover:bg-[#2a3b5a] hover:text-white transition-colors duration-150` | Low |
| Table row hover | CSS/Tailwind | `hover:bg-slate-50 transition-colors duration-100` | Low |
| Page transitions | Framer Motion | `AnimatePresence` with fade/slide on route change | Medium |
| Stats number count | Framer Motion | `useMotionValue` + `useTransform` for counting animation | Medium |
| Card entrance | Framer Motion | Staggered fade-in on page load | Low |
| Login form entrance | Framer Motion | Scale + fade animation | Low |

## State & Logic Plan

### Firebase Integration
- **Authentication**: Firebase Auth (email/password)
- **Database**: Firestore for all data (students, fees, seats, requests)
- **Collections**: `users`, `students`, `fees`, `seats`, `requests`, `attendance`

### React Context
- `AuthContext`: Firebase auth state, login/logout functions
- `DataContext`: Firestore data operations (CRUD for all collections)

### Routing
- React Router v6 with protected routes
- Route guard: redirect to /login if not authenticated
- After login: redirect to /

### Data Flow
1. Login → Firebase Auth → AuthContext
2. Pages read from Firestore via DataContext
3. Forms write to Firestore via DataContext
4. Real-time updates via Firestore onSnapshot

## Dependencies

```
# Already included
- react, react-dom
- typescript
- vite
- tailwindcss
- @/components/ui/* (shadcn)

# To install
- firebase
- react-router-dom
- framer-motion
- recharts
- lucide-react
```

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopHeader.tsx
│   │   └── MainLayout.tsx
│   ├── ui/                    # shadcn components
│   ├── StatCard.tsx
│   ├── QuickActionCard.tsx
│   ├── StatusBadge.tsx
│   ├── IconCircle.tsx
│   └── ExpiryAlertTable.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── NewAdmission.tsx
│   ├── FeeCollection.tsx
│   ├── SeatMap.tsx
│   ├── SeatMatrix.tsx
│   ├── Requests.tsx
│   ├── StudentRecords.tsx
│   └── Reports.tsx
├── context/
│   ├── AuthContext.tsx
│   └── DataContext.tsx
├── firebase/
│   └── config.ts
├── lib/
│   └── utils.ts
├── App.tsx
└── main.tsx
```

## Firebase Collections Schema

### students
```
{
  id: string,
  name: string,
  fatherName: string,
  mobile: string,
  email: string,
  address: string,
  course: string,
  seatNumber: string,
  feeAmount: number,
  photoURL: string,
  admissionDate: timestamp,
  status: 'active' | 'inactive' | 'expired'
}
```

### fees
```
{
  id: string,
  studentId: string,
  studentName: string,
  month: string,
  amount: number,
  paymentMode: 'cash' | 'upi' | 'card',
  notes: string,
  paymentDate: timestamp
}
```

### seats
```
{
  id: string,
  seatNumber: string,
  status: 'available' | 'occupied' | 'reserved',
  studentId: string | null,
  studentName: string | null,
  assignedDate: timestamp | null,
  expiryDate: timestamp | null
}
```

### requests
```
{
  id: string,
  studentId: string,
  studentName: string,
  requestType: 'seat_change' | 'leave' | 'other',
  details: string,
  status: 'pending' | 'approved' | 'rejected',
  requestDate: timestamp
}
```
