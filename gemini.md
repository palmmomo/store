# GEMINI.md — ระบบจัดการร้านอาหาร (Multi-Branch)

## ภาพรวมโปรเจกต์

ระบบบันทึกรายการซื้อ-ขายประจำวัน (Transaction Recording) แบบ Multi-Branch
- **ไม่ใช่ POS ขายหน้าร้าน** — เน้นการกรอกข้อมูลรายรับ/รายจ่าย
- รองรับช่องทางชำระเงิน: เงินสด / เงินโอน
- สรุปยอดรายวัน แยกตามสาขา
- ธีม: **Light/White Theme** สไตล์มินิมอล ใช้ **Lucide Icons** (ไม่ใช้ Emoji)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript (strict) |
| Styling | Vanilla CSS (Light/White Theme + CSS Variables) |
| Icons | Lucide React (ไม่ใช้ Emoji) |
| Backend | Golang + Gin Framework |
| Database | Supabase (PostgreSQL + Auth) |
| Auth | Supabase Auth (JWT) |
| Deployment | Vercel (Frontend) |

## สถานะปัจจุบัน (Session สุดท้าย: 2026-03-20)

### ✅ เสร็จแล้ว
- Frontend ทำงานครบทุกหน้า (mock data)
- Light/White Theme ใช้งานได้
- `npm run build` ผ่าน (แก้ TypeScript errors ทั้งหมดแล้ว)
- Push ขึ้น GitHub (`palmmomo/store`) สำเร็จ (branch: `main` + `dev`)
- สร้าง `vercel.json` สำหรับ SPA routing

### ⏳ ยังต้องทำต่อ
- [ ] ตั้งค่า Vercel ให้เชื่อมกับ GitHub repo (Root Directory = `frontend`)
- [ ] เชื่อมต่อ Supabase จริง (สร้างตาราง + ตั้ง ENV)
- [ ] ระบบ Login จริง (ตอนนี้ bypass ด้วย admin/admin)
- [ ] เปลี่ยน mock data เป็นเรียก API จริง
- [ ] เพิ่มหน้า Transaction modal ให้กรอกข้อมูลซื้อ-ขายได้จริง
- [ ] Product CRUD, Sorting/Filtering
- [ ] PDF Export / Invoice

## โครงสร้างโปรเจกต์

```
ระบบร้านอาหาร/
├── go.mod / go.sum
├── main.go                    # Golang entry point (root level)
├── backend/
│   ├── main.go                # Alternative entry point (in backend/)
│   ├── models/models.go
│   ├── db/supabase.go
│   ├── middleware/auth.go
│   └── handlers/
│       ├── auth.go            # Login, refresh token
│       ├── branches.go        # Branch CRUD
│       ├── products.go        # Product CRUD
│       ├── stock.go           # Stock management + logs
│       ├── orders.go          # Orders/Transactions
│       ├── stats.go           # Dashboard + charts + summary
│       └── admin.go           # User management
└── frontend/
    ├── vercel.json            # SPA routing config
    ├── .env.example
    ├── .env.local             # VITE_API_URL + VITE_DEV_BYPASS=true
    └── src/
        ├── api/
        │   ├── client.ts      # Axios API client + mock bypass
        │   └── mockData.ts    # Mock data สำหรับ demo
        ├── types/index.ts     # TypeScript interfaces
        ├── contexts/AuthContext.tsx
        ├── App.tsx            # Router + ALL pages (single file)
        ├── index.css          # Light theme design system
        └── pages/             # Legacy pages (ใช้กับ API จริง)
            ├── DashboardPage.tsx
            ├── StockPage.tsx
            ├── POSPage.tsx
            ├── StatsPage.tsx
            ├── OrdersPage.tsx
            ├── SummaryPage.tsx
            ├── LogsPage.tsx
            └── admin/
                ├── BranchManagePage.tsx
                └── UsersPage.tsx
```

## สิ่งสำคัญที่ต้องรู้

### App.tsx เป็น Single-File Application
- **ระบบปัจจุบันทำงานจาก `App.tsx` ไฟล์เดียว** (527 บรรทัด)
- รวม mock data, sidebar, router, และทุก page component ไว้ในไฟล์เดียว
- ไฟล์ใน `pages/` เป็นเวอร์ชันเก่าที่ต่อกับ API จริง (ยังไม่ได้ใช้ในตอนนี้)
- เมื่อเชื่อมต่อ backend จริง ควรแยก pages ออกจาก App.tsx

### Mock Data & Dev Bypass
- ตั้ง `VITE_DEV_BYPASS=true` ใน `.env.local` เพื่อใช้ mock data
- Login ด้วย `admin` / `admin` (ค่า hardcoded สำหรับ demo เท่านั้น)
- Mock data อยู่ใน `src/api/mockData.ts`

### TypeScript Strict Mode
- ใช้ `verbatimModuleSyntax` → **ต้องใช้ `import type { ... }` สำหรับ type imports เสมอ**
- Recharts Tooltip formatter → ใช้ `(v: any) => [...]` แทน `(v: number) => [...]`

## User Roles

| Role | สิทธิ์ |
|---|---|
| `admin` | เข้าถึงทุกอย่าง รวมถึงจัดการสาขาและ user ทุกสาขา |
| `staff` | บันทึกรายการ, ดู/ปรับสต็อกสาขาตัวเอง |

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
VITE_DEV_BYPASS=true           # ใช้ mock data (ปิดเมื่อต่อ backend จริง)
```

## วิธีรัน

### Frontend (Development)
```powershell
cd "c:\Work\ระบบร้านอาหาร\frontend"
npm run dev
# เปิด http://localhost:5173
```

### Frontend (Build)
```powershell
cd "c:\Work\ระบบร้านอาหาร\frontend"
npm run build
# output อยู่ที่ frontend/dist/
```

### Backend
```powershell
cd "c:\Work\ระบบร้านอาหาร"
go run main.go
```

## Vercel Deployment

- GitHub Repo: `palmmomo/store`
- Branches: `main` (production), `dev` (development)
- Vercel Settings:
  - **Root Directory:** `frontend`
  - **Framework Preset:** Vite
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
- `vercel.json` อยู่ใน `frontend/` จัดการ SPA routing (rewrite ทุก path ไป `index.html`)

## Supabase Setup (ยังไม่ได้ทำ)

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

-- Orders / Transactions
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

### 2026-03-20 — Session 1: Initial Setup + Redesign
- สร้าง Golang backend (Gin + JWT + Supabase REST client)
- Handler ครบ: auth, branches, products, stock, orders, stats, admin
- สร้าง React frontend (Vite + TypeScript)
- เริ่มต้นเป็น Dark Theme → **เปลี่ยนเป็น Light/White Theme** ตามความต้องการ
- เปลี่ยนจาก POS → **ระบบบันทึกรายการซื้อ-ขาย (Transaction Recording)**
- นำ Emoji ออกทั้งหมด → ใช้ **Lucide Icons** แทน
- เพิ่มฟีเจอร์: เงินสด/เงินโอน, Dashboard สรุปยอด, กราฟ 30 วัน
- แก้ TypeScript Build Errors (7 errors): `import type`, Recharts formatter types
- สร้าง `vercel.json` สำหรับ SPA routing
- Push ขึ้น GitHub สำเร็จ (branch: `main` + `dev`)

### 2026-03-20 — Session 2: Admin Dashboard & Branch Details
- เปลี่ยนชื่อหน้า Dashboard เป็น **Admin Dashboard** (ภาพรวมทุกสาขา)
- เพิ่มการติดตาม **สาขา (Branch)** ในทุกรายการบันทึก (Transaction)
- เพิ่มหน้า **Branch Detail** แสดง:
  - รายรับแยก เงินสด / ออนไลน์ (เงินโอน)
  - สต็อกวัตถุดิบแยกตามสาขา
  - ข้อมูลตามหมวดหมู่
- เพิ่มปุ่ม **เพิ่มสาขาใหม่** ในหน้าจัดการสาขา พร้อม Modal
- เพิ่มปุ่ม **แก้ไข/ลบ** ในหน้าจัดการผู้ใช้
- อัปเดต Sidebar และ Routing ให้รองรับระบบ Admin เต็มรูปแบบ
- แก้ไขปัญหา Unused Variables ใน `App.tsx`

### 2026-03-20 — Session 3: Role-Based Access & View Separation
- แยกหน้า **Admin Overview** และ **Branch Recording** ออกจากกันอย่างชัดเจน
- เพิ่มระบบ **Mock Login / Role Switcher** สำหรับเดโม (Admin, Staff)
- **Admin**: เข้าถึงได้ทุกหน้า (Dashboard รวม, รายงานทั้งหมด, จัดการผู้ใช้/สาขา)
- **Staff**:
  - ดูได้เฉพาะเมนู **บันทึกรายการ** และ **สต็อกวัตถุดิบ** ของสาขาตัวเอง
  - ระบบล็อคสาขาอัตโนมัติในหน้ากรอกข้อมูล (ไม่สามารถเลือกสาขาอื่นได้)
  - หน้า Dashboard รวมจะถูก Redirect ไปที่หน้าบันทึกรายการแทน
- ปรับปรุง UI หน้าบันทึกรายการให้รองรับการล็อคข้อมูลตามสิทธิ์

### 2026-03-20 — Session 4: Mock CRUD for Branches & Users
- ยกยอดข้อมูล `MOCK_BRANCHES` และ `MOCK_USERS` ขึ้นไปไว้ใน State ของ `App.tsx`
- **ระบบจัดการสาขา (Mock)**: สามารถกด "เพิ่มสาขาใหม่" และข้อมูลจะอัปเดตเข้าระบบทันที (สำหรับ Session นั้น)
- **ระบบจัดการผู้ใช้ (Mock)**: 
  - สามารถ เพิ่ม/แก้ไข/ลบ ผู้ใช้ได้จริงใน Mock State
  - เพิ่ม **ตัวเลือกสาขา (Branch Selector)** ในหน้าจัดการผู้ใช้ เพื่อกำหนดสาขาให้พนักงาน
- ปรับปรุง Sidebar ให้รองรับการสลับ User ตามรายการผู้ใช้ที่อัปเดตล่าสุด
- แก้ปัญหา TypeScript Error เกี่ยวกับ `useEffect` และ `INITIAL_USER`

### 2026-04-05 — Session 6: Inkjet/Signage Shop Pivot
- **ธุรกิจหลัก**: เปลี่ยนจากร้านอาหาร/ร้านไวนิล เป็น **ร้านป้ายอิงค์เจ็ท (Inkjet Signage Shop)**
- **Mock Data**: อัปเดตรายการซื้อ-ขายและสต็อกเป็นวัสดุงานป้ายทั้งหมด:
  - งานอิงค์เจ็ท (ตร.ม.), ป้ายไวนิล, สติ๊กเกอร์ PVC
  - งานโครงสร้าง, Standee, X-Frame, ธงญี่ปุ่น
- **Stock Management**: ติดตามวัสดุแบบม้วน (ไวนิล, สติ๊กเกอร์), หมึกพิมพ์ Outdoor CMYK, และวัสดุแผ่น (PP Board)
- **Smart Parser**: ปรับปรุงให้รองรับหน่วย "ตรม" (ตารางเมตร) และคำค้นหาเกี่ยวกับงานป้าย (ไวนิล, พิมพ์, โครง, ขาตั้ง)
- **UI Branding**: เปลี่ยนไอคอนเป็น `Printer` และชื่อระบบเป็น **"งานอิงค์เจ็ท"**
- แก้ปัญหา Syntax Error ในหน้าบันทึกกิจกรรม (LogsPage)
- ลบการอ้างอิงถึง "เสื้อสกรีน" และ "งานสกรีน" ออกทั้งหมดตามความต้องการผู้ใช้

## สิ่งที่ต้องทำต่อ
- [ ] เชื่อมต่อ Supabase จริง (ย้ายจาก Mock State)
- [ ] ระบบคำนวณราคาตาม ตร.ม. อัตโนมัติ (เลือกประเภทวัสดุ x กว้าง x ยาว)
- [ ] ระบบบันทึกรูปภาพงานที่พิมพ์เสร็จแล้ว (Upload to Supabase Storage)
- [ ] ระบบคิวงาน (Job Status: รอดำเนินการ -> กำลังพิมพ์ -> รอส่งคืน -> เรียบร้อย)
