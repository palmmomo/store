# 🔍 รายงานการตรวจสอบการเชื่อมต่อ (Connectivity Audit)

| สถานะ | ฟังก์ชัน / โมดูล | ปัญหาที่พบ | แนวทางแก้ไข |
| :--- | :--- | :--- | :--- |
| ❌ | **1. ค่าใช้จ่าย (Expenses)** | `api.get('/expenses')` เรียกไปยังหลังบ้านแต่ไม่มีการลงทะเบียน Route ใน `main.go` ทำให้เกิด Error 404 เมื่อกดเข้าหน้าค่าใช้จ่ายพนักงาน | ลงทะเบียน API Group `/expenses` ใน `main.go` และเชื่อมต่อกับ `handlers/expenses.go` |
| ❌ | **2. ประวัติการสั่งงาน (Orders)** | `GetOrders` และ `GetOrder` พยายาม Join ตาราง `order_items` ซึ่งไม่มีอยู่ใน Database schema ปัจจุบัน ทำให้ Error 500 | แก้ไข Query ใน `handlers/orders.go` ให้นำการ Join `order_items` ออก เนื่องจากปัจจุบันเก็บข้อมูลรายการในฟิลด์ `note` (Text) |
| ❌ | **3. บันทึกสต๊อกแบบง่าย (Simple Purchase)** | ฟังก์ชัน `SimplePurchaseMaterial` ใน `stock_handler.go:148` มี Argument ไม่ครบ (ต้องการ `userID`) ทำให้ Backend Build ไม่ผ่าน | เพิ่ม `middleware.GetUserID(c)` เข้าไปใน Argument ของการเรียก Service |
| ❌ | **4. ประวัติการซื้อ/เบิกวัสดุ** | หน้า `PurchaseHistoryPage.tsx` เรียก `/stock/purchase-history` และ `/stock/usage-history` ซึ่งยังไม่มี Endpoint รับในหลังบ้าน | เพิ่ม Endpoint ใน `main.go` และเชื่อมกับ Handler ใน `stock_handler.go` |
| ⚠️ | **5. ชื่อตารางวัสดุ (Materials vs Stock)** | หลังบ้านบางส่วนเรียกตาราง `stock` (Legacy) ในขณะที่ `SUPABASE_SETUP.sql` และ Repository ใช้ `materials` | ตรวจสอบและเปลี่ยนให้ใช้ `materials` ทั้งหมดเพื่อความสม่ำเสมอ |
| ⚠️ | **6. PDF Quotation Formatting** | เมื่อพิมพ์ใบเสนอราคา จะมี Header/Footer ของ Browser ติดมาด้วย (URL, วันที่, เลขหน้า) | เพิ่ม `@page { margin: 0; }` ใน CSS Print Styles เพื่อนำส่วนเกินออก |
| ✅ | **7. การจัดการสาขา (Branches)** | `branchApi` เชื่อมต่อได้ถูกต้องทั้ง GET, POST, PUT, DELETE | - |
| ✅ | **8. การจัดการผู้ใช้ (Users)** | `adminApi` เชื่อมต่อได้ถูกต้องทั้ง GET, POST, PUT, DELETE | - |
| ✅ | **9. ระบบ Login/Auth** | เชื่อมต่อผ่าน Supabase Auth สำเร็จ เก็บ Token ใน LocalStorage และแนบ Header อัตโนมัติ | - |
| ⚠️ | **10. Dashboard Stats** | ข้อมูล Dashboard รวม แสดงเป็น 0 เพราะยังไม่มีการ Join ข้อมูลการเงินจริงจากตาราง `expenses` | เมื่อแก้ข้อ 1 แล้ว ต้องปรับปรุง `handlers/stats.go` ให้คำนวณกำไร/ขาดทุนจากข้อมูลจริง |

---

### รายละเอียดทางเทคนิค (Technical Details)

#### Error 500 ในระบบ Orders
- **File:** `backend/handlers/orders.go`
- **Line:** 104 & 127
- **Detail:** `select=*,order_items(...)` — Supabase จะ Error "relation 'order_items' does not exist"

#### Build Error ใน Stock Handler
- **File:** `backend/handlers/stock_handler.go`
- **Line:** 148
- **Error:** `not enough arguments in call to h.srv.SimplePurchaseMaterial`

#### Missing Route Registration
- **File:** `backend/main.go`
- **Items:** 
  - `api.Group("/expenses")`
  - `stock.GET("/purchase-history")`
  - `stock.GET("/usage-history")`
