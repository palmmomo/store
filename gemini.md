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

## สถานะปัจจุบัน (Session สุดท้าย: 2026-04-07)

### ✅ เสร็จแล้ว
- Frontend เชื่อมต่อกับ Backend จริง (Supabase + Gin)
- Deploy ขึ้น Vercel ได้ (Frontend + Backend Serverless)
- ระบบ Login จริงด้วย Supabase Auth
- `npm run build` ผ่านทุกครั้ง
- หน้าสต็อกวัสดุ, ประวัติการจัดซื้อ, บันทึกรายการงาน
- Mobile responsive (hamburger menu + sidebar overlay + body scroll lock)
- สร้างไฟล์ `SUPABASE_SETUP.sql` อัปเดตล่าสุด (Consolidated - รวม fix files)
- Staff ดูและแก้ไขประวัติยอดขายของตัวเองได้
- Admin ดูและแก้ไขประวัติได้ทุกสาขา
- ระบบ Simple Purchase + Stock Update อัตโนมัติ
- ซ่อน Tab "สั่งซื้อ" สำหรับ Admin (ดูสต็อกอย่างเดียว)
- `go build ./...` ผ่านทุกครั้ง

### ⏳ ยังต้องทำต่อ
- [ ] QuotationPage: PDF layout improve + unit toggle (m/cm) + branch selector
- [ ] ระบบคำนวณราคาตาม ตร.ม. อัตโนมัติ
- [ ] ระบบบันทึกรูปภาพงาน (Supabase Storage)
- [ ] ระบบคิวงาน (Job Status tracking)

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

## Supabase Setup

> **ดู `SUPABASE_SETUP.sql`** ในโฟลเดอร์รากของโปรเจกต์สำหรับ SQL script ทั้งหมด

ตาราง (Tables) ที่ต้องสร้าง:

| Table | คำอธิบาย |
|---|---|
| `branches` | ข้อมูลสาขา (id = TEXT เช่น BR-abc1234) |
| `user_profiles` | เชื่อม user กับ auth.users, เก็บ role และ branch_id |
| `categories` | หมวดหมู่วัสดุ (id = INT auto-increment) |
| `suppliers` | คู่ค้า/ร้านค้าวัสดุ |
| `materials` | รายการวัสดุแต่ละสาขา |
| `purchase_transactions` | ประวัติการซื้อวัสดุ |
| `usage_transactions` | ประวัติการเบิกวัสดุ |
| `orders` | บิลงานอิงค์เจ็ท (id = UUID) |

การตั้ง Role ใน Supabase Auth Admin — ใส่ `app_metadata`:
```json
{
  "role": "superadmin",
  "branch_id": "BR-xxxxxxxx"
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

### 2026-04-06 — Session 7: Bug Fixes, Mobile Responsive & SQL Update

**ปัญหาที่แก้ไข:**
1. **ปุ่ม Login** — เพิ่ม `justifyContent: center` ให้ปุ่ม "เข้าสู่ระบบ" อยู่กึ่งกลาง
2. **เพิ่มสาขาไม่ได้** — `branches.go` แก้ไขให้ Generate `id` ในรูปแบบ `BR-xxxxxxxx` (TEXT) เนื่องจาก DB schema ไม่ใช้ UUID auto-generate
3. **Mobile Responsive** — เพิ่ม hamburger menu + sidebar overlay + breakpoints ครบถ้วน
4. **501 Error / ส่งข้อมูลไม่ได้** — `orders.go` ถูก Rewrite ให้รองรับ inkjet job data (description, width, height, price) แทน product_id แบบเก่า
5. **ความกว้าง/ยาวติดลบ** — `RecordPage.tsx` เพิ่ม `min="0"` + `Math.max(0,...)` validation
6. **เพิ่มวัสดุไม่ได้** — แก้ไข `StockPage.tsx` ให้ส่ง `initial_stock` field ถูกต้อง
7. **สร้างไฟล์ SQL** — สร้าง `SUPABASE_SETUP.sql` พร้อม seed data
8. **อัปเดต gemini.md** — อัปเดต Schema Section และ Activity Log

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
- [ ] QuotationPage: PDF ปรับ layout + เพิ่ม m/cm toggle + branch selector by role
- [ ] ระบบคำนวณราคาตาม ตร.ม. อัตโนมัติ (เลือกประเภทวัสดุ x กว้าง x ยาว)
- [ ] ระบบบันทึกรูปภาพงานที่พิมพ์เสร็จแล้ว (Upload to Supabase Storage)
- [ ] ระบบคิวงาน (Job Status: รอดำเนินการ -> กำลังพิมพ์ -> รอส่งคืน -> เรียบร้อย)

---

### 2026-04-07 — Session 8: Bug Fix Sprint (13 Issues)

**ปัญหาที่แก้ไข (Backend):**
1. **403 Error `GET /orders`** — นำ `RequireRole` ออกจาก orders GET route ให้ทุก role เข้าถึงได้ (handler filter เองตาม JWT branch_id)
2. **เพิ่ม PUT/DELETE orders** — `orders.go` เพิ่ม `UpdateOrder` และ `DeleteOrder` handlers พร้อม role-based permission
3. **500 Error Simple Purchase** — `stock_service.go`: แก้ Range variable capture bug, เพิ่ม re-fetch material after create เพื่อรับ real ID จาก DB, guard `material.ID > 0` ก่อน insert purchase
4. **`SUPABASE_SETUP.sql`** — Consolidated ใหม่: รวม `fix_duplicate_key.sql` และ `fix_duplicate_key_complete.sql` เข้าไป แล้วลบ fix files เก่าออก เพิ่ม payment column, indexes, และ RLS documentation
5. **`orders` table** — เพิ่ม `payment` field ใน schema และ handler

**ปัญหาที่แก้ไข (Frontend):**
6. **Hamburger Menu ไม่ปิด** — `Sidebar.tsx`: เปลี่ยน overlay จาก CSS class เป็น conditional render, เพิ่ม `body scroll lock` ด้วย `useEffect`
7. **ประวัติขายไม่แสดง** — `RecordPage.tsx`: แก้ `getItemsDescription` ให้ parse `note` field (format: `ชำระ: xxx | item1 | item2`) แทน items array ที่ไม่มีอยู่จริงใน orders table
8. **ปุ่ม Edit/Delete ใน RecordPage** — เพิ่มปุ่มแก้ไขและลบใน history table สำหรับ staff
9. **SalesHistoryPage Role-based** — Admin: ดูทุกสาขา + edit/delete; Staff: เห็นเฉพาะสาขาตัวเอง + edit/delete เฉพาะของตัวเอง, เพิ่ม Edit Modal
10. **StockPage Admin view** — ซ่อน tab "สั่งซื้อของเข้าร้าน" สำหรับ admin/superadmin
11. **Numeric input placeholder** — เปลี่ยน default state จาก `0` เป็น `''` ใน StockPage, ใช้ `placeholder="0.00"`
12. **RecordPage ซ่อน Width/Height** — ซ่อนฟิลด์กว้าง/ยาว ให้กรอกแค่ชื่อและราคา
13. **Sidebar ปุ่ม X** — แก้ให้แสดงบน mobile เสมอ, X button ปิด sidebar ได้อย่างถูกต้อง

**ยังต้องทำต่อ:**
- QuotationPage: PDF layout improve, unit toggle m/cm, branch selector by role
- ตรวจสอบว่า `payment` column มีอยู่ใน Supabase (รัน Section 6 ของ SUPABASE_SETUP.sql)
