# GEMINI.md — ระบบจัดการร้านป้าย (Stock Management)

## ภาพรวมโปรเจกต์

ระบบจัดการสต็อกสินค้า (Stock Management) แบบ Single-Shop
- **3 Roles**: Admin, Accountant (บัญชี), Technician (ช่าง)
- Admin: Dashboard, Stock (CRUD + ประวัติ), สาขา, ใบเสนอราคา, การดำเนินงาน, จัดการ Users
- Accountant: ซื้อของเข้าสต็อก, ใบเสนอราคา, การดำเนินงาน
- Technician: เบิกของออก, การดำเนินงาน
- ธีม: **Light/White Theme** สไตล์มินิมอล ใช้ **Lucide Icons**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript (strict) |
| Styling | Vanilla CSS (Light/White Theme + CSS Variables) |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core + sortable |
| PDF | jsPDF + html2canvas + thai-baht-text |
| Backend | Golang + Gin Framework |
| Database | Supabase (PostgreSQL + Auth) |
| Auth | Supabase Auth (JWT) |
| Deployment | Vercel (Frontend + Backend Serverless) |

## สถานะปัจจุบัน (Session: 2026-04-29)

### ✅ เสร็จแล้ว
- Phase 1: Full refactor → Single-Shop Stock Management
- Phase 2: Branch, Quotation (PDF), Kanban Jobs, Edit/Delete History
- Phase 2.1: Bug fixes + Dashboard summary + Accountant stock creation + Quotation→Job flow
- 3 Roles: admin, accountant, technician
- 7 DB tables: users, stock_items, stock_purchases, stock_withdrawals, branches, quotations, jobs
- `go build ./...` ผ่าน
- `npm run build` ผ่าน

### ⏳ ยังต้องทำต่อ
- [ ] รัน SUPABASE_SETUP.sql ใน Supabase SQL Editor (Phase 2 + 2.1 tables)
- [ ] ทดสอบกับ backend จริง
- [ ] Deploy ขึ้น Vercel

## โครงสร้างโปรเจกต์

```
ระบบร้านอาหาร/
├── SUPABASE_SETUP.sql
├── gemini.md
├── backend/
│   ├── .env
│   ├── main.go + app/app.go
│   ├── db/supabase.go
│   ├── middleware/auth.go
│   ├── models/models.go
│   └── handlers/
│       ├── auth.go, admin.go
│       ├── stock_items.go
│       ├── purchases.go (+ edit/delete)
│       ├── withdrawals.go (+ edit/delete)
│       ├── branches.go
│       ├── quotations.go
│       └── jobs.go (+ price, quotation_id, dashboard summary)
└── frontend/src/
    ├── api/client.ts
    ├── types/index.ts
    ├── contexts/AuthContext.tsx
    ├── App.tsx
    ├── index.css
    ├── components/Sidebar.tsx
    └── pages/
        ├── LoginPage.tsx
        ├── AdminDashboardPage.tsx (financial summary)
        ├── AdminStockPage.tsx (stock + ประวัติ 3 tabs)
        ├── AdminUsersPage.tsx
        ├── BranchesPage.tsx
        ├── QuotationPage.tsx (+ PDF html2canvas + create job)
        ├── JobsPage.tsx (Kanban + DragOverlay + price)
        ├── AccountantPurchasePage.tsx (+ add stock item)
        └── TechnicianWithdrawPage.tsx
```

## Sidebar Menu by Role

| เมนู | Admin | Accountant | Technician |
|------|:-----:|:----------:|:----------:|
| Dashboard | ✅ | ❌ | ❌ |
| Stock | ✅ | ❌ | ❌ |
| ซื้อของเข้า | ❌ | ✅ | ❌ |
| เบิกของ | ❌ | ❌ | ✅ |
| ใบเสนอราคา | ✅ | ✅ | ❌ |
| การดำเนินงาน | ✅ | ✅ | ✅ |
| สาขา | ✅ | ❌ | ❌ |
| จัดการผู้ใช้ | ✅ | ❌ | ❌ |

## API Routes

```
POST /api/auth/login | /api/auth/refresh | /api/auth/setup

GET/POST           /api/stock       (all / admin+accountant for POST)
PUT/DELETE         /api/stock/:id   (admin)

GET/POST/PUT/DELETE /api/purchases   (admin, accountant)
GET/POST/PUT/DELETE /api/withdrawals (admin, technician)
GET/POST/PUT/DELETE /api/branches    (admin)
GET/POST/PUT/DELETE /api/quotations  (admin, accountant)
POST               /api/quotations/:id/create-job (admin, accountant)
GET/POST/PUT/DELETE /api/jobs        (all)
GET                 /api/dashboard/summary (admin)
GET/POST/PUT/DELETE /api/admin/users (admin)
GET                 /api/admin/history (admin)
```

## Activity Log

### 2026-04-29 — Phase 2: System Extension (6 Features)

1. **Admin Sidebar** — Dashboard เป็น placeholder, Stock page รวม 3 tabs (สต็อก, ซื้อเข้า, เบิกออก)
2. **Edit/Delete History** — ทุก purchase/withdrawal แก้ไข/ลบได้ พร้อม stock diff auto-update
3. **Branch Management** — CRUD สาขาสำหรับใบเสนอราคา
4. **Quotation System** — CRUD + PDF export (jsPDF) + Thai number-to-words
5. **Kanban Job Board** — 5 สถานะ drag-and-drop + payment status colors
6. **Updated Sidebar** — เมนูตาม role matrix ใหม่

Files created: branches.go, quotations.go, jobs.go, AdminStockPage.tsx, BranchesPage.tsx, QuotationPage.tsx, JobsPage.tsx
Files modified: purchases.go, withdrawals.go, main.go, app.go, client.ts, types/index.ts, App.tsx, Sidebar.tsx, SUPABASE_SETUP.sql
Files deleted: AdminHistoryPage.tsx

### 2026-04-29 — Phase 2.1: Bug Fixes + New Features

**Bug Fixes:**
1. **ใบเสนอราคา — Number overflow** → ใช้ parseFloat ถูกต้อง, ป้องกัน NaN
2. **ใบเสนอราคา — ตัวอักษรไทย** → ใช้ `thai-baht-text` library แทน custom function
3. **PDF — ภาษาไทย** → เปลี่ยนจาก jsPDF text เป็น `html2canvas` + Sarabun font
4. **Input spinners** → ปิด spinner ด้วย CSS `.qty-input`

**New Features:**
5. **Dashboard — Financial Summary** → 3 cards: รายได้/ค่าวัสดุ/กำไรสุทธิ
6. **Accountant — เพิ่มสินค้าใหม่** → ปุ่ม "เพิ่มสินค้าใหม่" ในหน้าซื้อของ
7. **ใบเสนอราคา → สร้างงาน** → Modal ถาม + POST /api/quotations/:id/create-job
8. **Jobs — ราคางาน** → เพิ่ม field price + quotation_id ใน jobs table
9. **Kanban — Drag & Drop ปรับปรุง** → DragOverlay, closestCorners, DroppableColumn highlight

Files modified: jobs.go, main.go, app.go, client.ts, types/index.ts, QuotationPage.tsx, JobsPage.tsx, AdminDashboardPage.tsx, AccountantPurchasePage.tsx, index.css, SUPABASE_SETUP.sql

### 2026-04-29 — Phase 2.2: Auth & Mobile Patches

**Bug Fixes:**
1. **Branch Access (403)** → เปิด `GET /api/branches` ให้ Accountant เข้าถึงได้ (สำหรับดึงข้อมูลลงใบเสนอราคา) ใน `main.go` และ `app.go`
2. **Quotation Access** → ยืนยันว่า `GET /api/quotations` และ frontend route `/quotation` เปิดให้ Accountant เข้าถึงได้เรียบร้อยแล้ว

**Mobile Responsiveness:**
3. **Sidebar Menu** → ยืนยันการมีอยู่ของ Hamburger Menu สำหรับ Mobile ใน `Sidebar.tsx` พร้อมปรับแต่ง CSS Overlay
4. **Kanban Board** → เพิ่ม horizontal scroll ใน `index.css`
5. **Tables** → เพิ่ม horizontal scroll ให้กับตาราง
6. **Modals** → ปรับ Modal ให้แสดงผลแบบเต็มจอ (bottom sheet) บนมือถือ
7. **Quotation Items** → ปรับ layout input แถวรายการสินค้าให้เป็น block / flex wrap เพื่อการพิมพ์ที่ง่ายขึ้นบนมือถือ

### 2026-04-29 — Phase 2.3: Mobile UX Fixes

**UX Improvements:**
1. **Layout / Sidebar** → แก้บัค `html, body` scroll ซ้ายขวา ด้วย `overflow-x: hidden` + `max-width: 100vw`. แก้ให้ Sidebar ดันคอนเทนต์มาเป็น full-width ตอนใช้มือถือ
2. **Card Tables** → เพิ่ม `.responsive-table` ในตาราง `BranchesPage`, `AdminStockPage`, และ `QuotationPage` เพื่อแสดงข้อมูลในรูปแบบ Card (data-label) บนจอมือถือ
3. **Kanban Board** → เพิ่ม `TouchSensor` ให้กับ `@dnd-kit/core` สำหรับการ Drag and Drop บนมือถือ, ใช้ `.kanban-dots` แสดงจุดสถานะตำแหน่งสกอร์ลของคอลัมน์ (active state)
4. **Quotation Form** → จัดหน้าตาฟอร์มกรอกรายการสินค้าแบบ Card stack บนมือถือด้วย `.field-label` และซ่อน Header ตารางหลัก

Files modified: `index.css`, `JobsPage.tsx`, `QuotationPage.tsx`, `BranchesPage.tsx`, `AdminStockPage.tsx`

