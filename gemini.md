# GEMINI.md — ระบบจัดการร้านอาหาร (Multi-Branch)

## ภาพรวมโปรเจกต์

ระบบจัดการร้านอาหารแบบ Multi-Branch ใช้สำหรับจัดการสต็อก, POS, สถิติยอดขาย, และบริหารหลายสาขา

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Vanilla CSS (Dark Theme + CSS Variables) |
| Backend | Golang + Gin Framework |
| Database | Supabase (PostgreSQL + Auth) |
| Auth | Supabase Auth (JWT) |

## โครงสร้างโปรเจกต์

```
ระบบร้านอาหาร/
├── main.go                    # Golang entry point (Gin server)
├── go.mod / go.sum
├── .env.example               # Template สำหรับ env backend
├── .gitignore
├── backend/
│   ├── models/models.go       # Data models
│   ├── db/supabase.go         # Supabase REST client
│   ├── middleware/auth.go     # JWT middleware + RBAC
│   └── handlers/
│       ├── auth.go            # Login, refresh token
│       ├── branches.go        # Branch CRUD
│       ├── products.go        # Product CRUD
│       ├── stock.go           # Stock management + logs
│       ├── orders.go          # POS orders
│       ├── stats.go           # Dashboard + charts + summary
│       └── admin.go           # User management (Supabase Admin API)
└── frontend/
    ├── .env.example           # Template สำหรับ env frontend
    └── src/
        ├── api/client.ts      # Axios API client (typed)
        ├── types/index.ts     # TypeScript interfaces
        ├── contexts/AuthContext.tsx
        ├── components/Sidebar.tsx
        ├── App.tsx            # Router + protected routes
        ├── index.css          # Global styles (dark theme)
        └── pages/
            ├── LoginPage.tsx
            ├── DashboardPage.tsx
            ├── StockPage.tsx
            ├── POSPage.tsx
            ├── OrdersPage.tsx
            ├── StatsPage.tsx
            ├── SummaryPage.tsx
            ├── LogsPage.tsx
            └── admin/
                ├── BranchManagePage.tsx
                └── UsersPage.tsx
```

## User Roles

| Role | สิทธิ์ |
|---|---|
| `superadmin` | เข้าถึงทุกอย่าง รวมถึงจัดการสาขาและ user ทุกสาขา |
| `branch_admin` | จัดการสาขาตัวเอง, ดู stats/orders/logs |
| `staff` | ใช้ POS, ดู/ปรับสต็อกสาขาตัวเอง |

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...       # Service Role Key (ใช้ใน backend เท่านั้น)
SUPABASE_JWT_SECRET=...        # จาก Supabase Settings > API > JWT Secret
PORT=8080
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8080
```

## วิธีรัน

### Backend
```powershell
# สร้าง .env จาก .env.example แล้วใส่ค่า
cd "c:\Work\ระบบร้านอาหาร"
go run main.go
```

### Frontend
```powershell
# สร้าง .env.local จาก frontend/.env.example
cd "c:\Work\ระบบร้านอาหาร\frontend"
npm run dev
```

## Supabase Setup ที่ต้องทำ

1. สร้างตารางใน Supabase:

```sql
-- Branches
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  name text not null,
  price decimal(10,2) not null,
  category text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stock
create table stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  branch_id uuid references branches(id),
  quantity int default 0,
  min_level int default 5,
  unit text default 'ชิ้น',
  updated_at timestamptz default now()
);

-- Stock Logs
create table stock_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  branch_id uuid references branches(id),
  change int not null,
  reason text,
  user_id uuid,
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  user_id uuid,
  total decimal(10,2) default 0,
  status text default 'completed',
  note text,
  created_at timestamptz default now()
);

-- Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  product_id uuid references products(id),
  quantity int not null,
  price decimal(10,2) not null
);
```

2. ตั้ง Role ใน Supabase Auth Admin — ใส่ `app_metadata`:
```json
{
  "role": "superadmin"
}
```

## การเปลี่ยนแปลง / Activity Log

### 2026-03-20 — Initial Setup
- สร้าง Golang backend (Gin + JWT + Supabase REST client)
- Handler ครบ: auth, branches, products, stock, orders, stats, admin
- สร้าง React frontend (Vite + TypeScript)
- Dark theme CSS design system
- หน้าทั้งหมด: Login, Dashboard, Stock, POS, Orders, Stats, Summary, Logs
- Admin pages: Branch management, User management
- Auth: บังคับ login ก่อนใช้งาน, role-based route protection
- Security: .env ไม่ commit, Service Key ใน backend เท่านั้น
