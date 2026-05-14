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
| Canvas Editor | Fabric.js (v6) |
| PDF | jsPDF + html2canvas + thai-baht-text |
| Backend | Golang + Gin Framework |
| Database | Supabase (PostgreSQL + Auth) |
| Auth | Supabase Auth (JWT) |
| Deployment | Vercel (Frontend + Backend Serverless) |

## สถานะปัจจุบัน (Session: 2026-05-13)

### ✅ เสร็จแล้ว
- Phase 1: Full refactor → Single-Shop Stock Management
- Phase 2: Branch, Quotation (PDF), Kanban Jobs, Edit/Delete History
- Phase 2.1–2.4: Bug fixes, Mobile UX, Stock History
- Phase 3: Quote Template Designer (Fabric.js Canvas Editor)
- 3+ Roles: admin, accountant, technician, designer
- 9 DB tables: users, stock_items, stock_purchases, stock_withdrawals, branches, quotations, jobs, quote_templates, quote_drafts
- `go build ./...` ผ่าน
- `npm run build` ผ่าน

### ⏳ ยังต้องทำต่อ
- [ ] รัน SUPABASE_SETUP.sql ใน Supabase SQL Editor (Phase 3 tables)
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
│       ├── jobs.go (+ price, quotation_id, dashboard summary)
│       └── quote_templates.go (template + drafts CRUD)
└── frontend/src/
    ├── api/client.ts
    ├── types/index.ts
    ├── contexts/AuthContext.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Sidebar.tsx
    │   └── CanvasEditor.tsx (Fabric.js canvas editor)
    └── pages/
        ├── LoginPage.tsx
        ├── AdminDashboardPage.tsx (financial summary)
        ├── AdminStockPage.tsx (stock + ประวัติ 3 tabs)
        ├── AdminUsersPage.tsx
        ├── BranchesPage.tsx
        ├── QuotationPage.tsx (+ PDF html2canvas + create job)
        ├── JobsPage.tsx (Kanban + DragOverlay + price)
        ├── AccountantPurchasePage.tsx (+ add stock item)
        ├── TechnicianWithdrawPage.tsx
        └── TemplateDesignerPage.tsx (canvas template designer)
```

## Sidebar Menu by Role

| เมนู | Admin | Accountant | Technician |
|------|:-----:|:----------:|:----------:|
| Dashboard | ✅ | ❌ | ❌ |
| Stock | ✅ | ❌ | ❌ |
| ซื้อของเข้า | ❌ | ✅ | ❌ |
| เบิกของ | ❌ | ❌ | ✅ |
| ใบเสนอราคา | ✅ | ✅ | ❌ |
| แบบใบเสนอราคา | ✅ | ✅ | ❌ |
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

GET/PUT             /api/quote-templates/:branch_id (admin, accountant)
GET/POST            /api/quote-drafts/:branch_id (admin, accountant)
GET/DELETE          /api/quote-drafts/:branch_id/:draft_id (admin, accountant)
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

### 2026-04-29 — Phase 2.4: Admin Stock History Fix

**Bug Fixes:**
1. **Admin Stock History** → แก้ไขปัญหาหน้า Stock ของ Admin ไม่แสดงประวัติการซื้อเข้าและการเบิกออก เนื่องจาก backend คืนค่า object ซ้อนกัน (nested relations) แล้ว frontend เข้าถึงข้อมูลไม่ครบ
2. **Flatten Data in Backend** → ปรับแก้ `GetPurchases` และ `GetWithdrawals` ใน backend ให้ map ค่า `stock_items(name,unit)` และ `users(email)` ลงมาเป็น `item_name`, `item_unit`, `purchased_by_email` และ `withdrawn_by_email` ในระดับบนสุด (flatten) เพื่อง่ายต่อการนำไปแสดงผล
3. **Frontend Table Rendering** → ปรับ `AdminStockPage.tsx` ให้รองรับข้อมูลที่แบนราบนี้ และอัปเดต type `StockPurchase` / `StockWithdrawal` ใน `frontend/src/types/index.ts`

Files modified: `backend/handlers/purchases.go`, `backend/handlers/withdrawals.go`, `frontend/src/types/index.ts`, `frontend/src/pages/AdminStockPage.tsx`

### 2026-05-13 — Phase 3: Quote Template Designer (Fabric.js)

**New Feature: แบบใบเสนอราคา (Canvas-based Quote Template Designer)**

1. **Fabric.js Canvas Editor** → Canvas editor แบบ Canva สำหรับออกแบบ layout ใบเสนอราคา A4 (794×1123px)
2. **Locked Elements** → องค์ประกอบที่ลบไม่ได้ (ชื่อบริษัท, สาขา, เลขที่, วันที่, ลูกค้า, ตารางรายการ, รวมเงิน, ลายเซ็น) แต่ย้าย/ปรับสไตล์ได้
3. **Free Elements** → ข้อความ, รูปภาพ, สี่เหลี่ยม, เส้น, วงกลม เพิ่มได้อิสระ
4. **Per-Branch Templates** → แต่ละสาขามีแบบของตัวเอง สลับสาขาแล้วโหลดแบบเฉพาะ
5. **Draft History** → บันทึกร่างหลายเวอร์ชัน + restore ร่างเก่าได้
6. **PDF Export** → ส่งออก canvas เป็น PDF A4
7. **Properties Panel** → ปรับฟอนต์, ขนาด, สี, ตัวหนา/เอียง, จัดตำแหน่งข้อความ
8. **Undo/Redo** → Ctrl+Z / Ctrl+Y (เก็บ history 30 states)
9. **Snap-to-Grid** → จับตำแหน่งอัตโนมัติทุก 10px
10. **Layer Controls** → ย้ายขึ้น/ลงเลเยอร์

**Database:** 2 tables ใหม่ — `quote_templates` (UNIQUE per branch) + `quote_drafts` (version history)

Files created: `backend/handlers/quote_templates.go`, `frontend/src/components/CanvasEditor.tsx`, `frontend/src/pages/TemplateDesignerPage.tsx`
Files modified: `SUPABASE_SETUP.sql`, `backend/main.go`, `backend/app/app.go`, `frontend/src/types/index.ts`, `frontend/src/api/client.ts`, `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/index.css`, `gemini.md`
Dependencies added: `fabric` (Fabric.js v6)

### 2026-05-13 — Phase 3.1: Template Designer Fixes

**Bug Fixes:**
1. **Backend 404** → แก้ context key จาก `userID` เป็น `user_id` ให้ตรงกับ middleware ใน `quote_templates.go`
2. **PDF Export** → แก้ไฟล์ PDF ดาวน์โหลดได้ชื่อผิด (UUID) → ใช้ `arraybuffer` + `new Blob` กำหนด MIME type `application/pdf` + ชื่อไฟล์ ASCII-safe
3. **Element List** → เพิ่มรายการองค์ประกอบทั้งหมดในแผง Properties ด้านขวา (คลิกเพื่อเลือก, แสดง lock/unlock, ประเภท+ชื่อ)
4. **Shape Free Resize** → เพิ่ม `lockUniScaling: false` ให้ Rect + Circle ยืดหดอิสระ
5. **PDF File Size** → ลด multiplier จาก 2 เป็น 1.5 ลดขนาดไฟล์

Files modified: `quote_templates.go`, `CanvasEditor.tsx`, `TemplateDesignerPage.tsx`, `index.css`

### 2026-05-14 — Phase 4: Quotation PDF Fix + Job System Overhaul (7 Features)

**1. Fix Quotation PDF Layout:**
- เปลี่ยน layout PDF ใบเสนอราคาให้ตรงกับ reference PDF
- Header: ชื่อบริษัท (ตัวหนา ใหญ่), ที่อยู่, โทร, เลขผู้เสียภาษี — จัดกลาง
- Horizontal divider ใต้ header
- Title: "ใบเสนอราคา / QUOTATION" — จัดกลาง ตัวหนา
- Left block: ผู้ซื้อ, ที่อยู่, เลขผู้เสียภาษี / Right block: เลขที่, วันที่
- ตาราง bilingual (ที่/ITEM, รายการ/DESCRIPTION, จำนวน/QUANTITY, ราคา/หน่วย PRICE/UNIT, จำนวนเงิน AMOUNT/BAHT)
- Footer row: ตัวอักษร/In Letter + รวมสุทธิ Grand Total
- ลายเซ็น: ผู้เสนอราคา + เส้นประ + วันที่

**2. Fix PDF Download (Blob approach):**
- ใช้ `pdf.output('arraybuffer')` + `new Blob` + `URL.createObjectURL` แทน `pdf.save()` เพื่อให้ดาวน์โหลดได้ทุกกรณี

**3. Remove Payment Status Color Badges:**
- ลบ badge สีจ่ายแล้ว/มัดจำ/ไม่จ่ายออกจาก Job Cards
- ยังเก็บข้อมูล payment_status ไว้ใน DB ไม่ลบ

**4. Add Note/Memo to Job:**
- เพิ่ม field `note` ใน jobs table (TEXT DEFAULT '')
- เพิ่ม textarea บันทึกช่วยจำในฟอร์มสร้าง/แก้ไขงาน
- แสดง note preview บน Job Card + modal ดู note เต็ม

**5. Quotation → Auto-create Jobs (per line item):**
- เปลี่ยน `CreateJobFromQuotation` จากสร้าง 1 งาน → สร้าง 1 งานต่อ 1 รายการ
- ชื่องาน: `QT-XXXX: [description]`, ราคา = total ของ item นั้น
- ทุกงาน reference กลับ quotation_id

**6. Kanban / Job Board — 2 Columns:**
- เปลี่ยนจาก 5 columns เป็น 2: **Pool งาน** (🔴 Red) + **เสร็จแล้ว** (🟢 Green)
- Card สีพื้นหลังตามสถานะ
- สถานะ: `pool`, `done` (แทนที่ Thai text เดิม)
- DB constraint อัปเดต: `CHECK (status IN ('pool', 'done'))`

**7. Print Receipt from Completed Job:**
- ปุ่ม 🖨️ บน Job Card ที่สถานะ done
- ถ้างานมาจาก multi-item quotation → receipt รวมทุกงานจาก quotation เดียวกัน
- แต่ละแถวมีสีพื้นหลังตามสถานะ (🔴 pool / 🟢 done)
- ลายเซ็น: ผู้รับเงิน + ผู้จ่ายเงิน

**Database Changes:**
- `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';`
- `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;`
- `ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('pool', 'done'));`

Files modified: `QuotationPage.tsx`, `JobsPage.tsx`, `types/index.ts`, `client.ts`, `jobs.go`, `SUPABASE_SETUP.sql`, `gemini.md`

### 2026-05-14 — Phase 4.1: Emoji Removal + Custom Status Text

**1. ลบ Emoji ทั้งหมด → ใช้ Lucide Icons แทน:**
- 📋 → `<FileText />` (quotation reference)
- 📝 → `<StickyNote />` (note label)
- ใช้ `<MessageSquare />` สำหรับ custom status text

**2. เพิ่ม `status_text` — สถานะย่อยแบบพิมพ์เอง:**
- เพิ่ม field `status_text` ใน jobs table (TEXT DEFAULT '')
- Pool งาน + ไม่มี status_text → การ์ดสีแดง 🔴
- Pool งาน + มี status_text (เช่น "แก้งานอยู่") → การ์ดสีเหลือง 🟡
- เสร็จแล้ว → การ์ดสีเขียว 🟢
- ฟิลด์ input จะแสดงเฉพาะเมื่อ status = pool

Files modified: `JobsPage.tsx`, `types/index.ts`, `client.ts`, `jobs.go`, `SUPABASE_SETUP.sql`, `gemini.md`

### 2026-05-14 — Phase 5: Kanban & System Overhaul

**1. Dynamic Kanban Columns (Job Statuses):**
- เพิ่มตาราง `job_statuses` และ API เพื่อให้ผู้ใช้สามารถสร้าง คอลัมน์สถานะ (เช่น สั่งพิมพ์, รอติดตั้ง) พร้อมเลือกสีประจำสถานะได้เอง
- เลิกใช้ fixed status constraint (`pool`, `done`) ใน DB

**2. Modern Kanban Redesign:**
- รีดีไซน์หน้า Kanban เป็นการ์ดแบบใหม่ มี gradient, shadow, icon ขอบมน ให้ดูเป็นแอประดับพรีเมียม
- สีของการ์ดจะตรงกับสีที่ผู้ใช้เลือกสำหรับสถานะนั้น
- บังคับระบุชื่อ **ผู้รับผิดชอบ (Assignee)** ในทุกการ์ดงาน

**3. Fabric.js PDF Export (Quotation):**
- ใบเสนอราคาถูกดึงแบบมาจากตาราง `quote_templates` เพื่อเรนเดอร์ PDF แทนการใช้ HTML แบบตายตัว
- นำข้อมูลลูกค้า, รายการสินค้า ไปวาดลง Fabric.js Canvas โดยตรงก่อนสั่ง Export เป็น PDF
- ทำให้เลย์เอาต์ PDF ออกมาตรงตามแบบที่ตั้งค่าไว้ในหน้า "แบบใบเสนอราคา" 100%

**4. Mobile Fixes:**
- เพิ่ม Touch targets (ความสูง 44px) ให้ปุ่มและช่องกรอกข้อมูล
- เพิ่ม Horizontal scroll ให้กับตารางและ Kanban บนมือถือ

Files modified: `SUPABASE_SETUP.sql`, `backend/handlers/jobs.go`, `backend/main.go`, `frontend/src/types/index.ts`, `frontend/src/api/client.ts`, `frontend/src/pages/JobsPage.tsx`, `frontend/src/index.css`, `frontend/src/pages/QuotationPage.tsx`, `gemini.md`

### 2026-05-14 — Phase 5.1: Critical Bug Fixes (Delete + Page Freeze + CORS)

**1. QuotationPage Freeze (Root Cause: Static Fabric.js Import):**
- `import { Canvas, Textbox } from 'fabric'` ที่ top-level ทำให้ Fabric.js (~1MB) โหลดทันทีตอนเปิดหน้า
- **บล็อก main thread** ทำให้ทุกปุ่มบนหน้า QuotationPage กดไม่ได้เลย (รวมถึงปุ่มลบ, แก้ไข, PDF ฯลฯ)
- **แก้ไข**: เปลี่ยนเป็น `const { Canvas, Textbox } = await import('fabric')` ภายในฟังก์ชัน `exportPDF()` — โหลดเฉพาะตอนกดปุ่ม PDF เท่านั้น

**2. CORS Fix:**
- เปลี่ยน CORS config จาก `AllowOrigins` เฉพาะเจาะจง → `AllowAllOrigins: true`
- เพิ่ม `Accept` ใน AllowHeaders

**3. Delete Confirmation Dialogs:**
- ลบ Job: แสดงข้อความเตือนว่าเชื่อมกับใบเสนอราคาหรือไม่
- ลบ Quotation: แสดงว่างานที่เชื่อมจะถูกตัด link (ON DELETE SET NULL)
- ลบ Draft: ข้อความยืนยันสั้นๆ

**4. FK Constraint Fix:**
- `ALTER TABLE jobs ADD CONSTRAINT jobs_quotation_id_fkey ... ON DELETE SET NULL`
- ทำให้ลบ quotation ได้โดยไม่ติด FK violation

**5. Error Handling:**
- Backend: ทุก Delete handler ส่ง error message ภาษาไทยพร้อม `err.Error()` กลับมา
- Frontend: ทุก catch block ดึง `err.response?.data?.error` มาแสดงใน Toast

Files modified: `QuotationPage.tsx`, `JobsPage.tsx`, `TemplateDesignerPage.tsx`, `main.go`, `quotations.go`, `jobs.go`, `quote_templates.go`, `SUPABASE_SETUP.sql`, `gemini.md`
