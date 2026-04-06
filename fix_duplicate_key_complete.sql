-- =====================================================
-- SQL FIX: Supabase Duplicate Key Error (materials_pkey)
-- Error: duplicate key value violates unique constraint
-- Key (id)=(0) already exists.
-- =====================================================

-- วิธีที่ 1: ตรวจสอบและแก้ไข sequence (ถ้าใช้ SERIAL หรือ IDENTITY)
-- ขั้นตอน 1: หา sequence name ที่ใช้กับตาราง materials
SELECT 
  c.relname AS table_name,
  a.attname AS column_name,
  pg_get_serial_sequence(c.relname::text, a.attname::text) AS sequence_name
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relname = 'materials' 
AND a.attname = 'id';

-- ขั้นตอน 2: ตรวจสอบค่าปัจจุบันของ sequence
-- (แทน 'materials_id_seq' ด้วยชื่อ sequence ที่ได้จากขั้นตอน 1)
SELECT last_value, max_value FROM materials_id_seq;

-- ขั้นตอน 3: ตั้งค่า sequence ให้เริ่มจากค่า max(id) + 1
SELECT setval('materials_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM materials));

-- วิธีที่ 2: ถ้ายังมีปัญหา ให้ลบข้อมูล id=0 ออก (ถ้ามี)
-- ระวัง: ตรวจสอบว่าไม่มี foreign key constraints ก่อนลบ
DELETE FROM materials WHERE id = 0;

-- วิธีที่ 3: ถ้าใช้ UUID แทน auto-increment (แนะนำสำหรับ production)
-- เปลี่ยน id column ให้ใช้ UUID
/*
ALTER TABLE materials 
ALTER COLUMN id DROP DEFAULT,
ALTER COLUMN id SET DATA TYPE UUID USING gen_random_uuid(),
ALTER COLUMN id SET DEFAULT gen_random_uuid();
*/

-- วิธีที่ 4: ถ้าต้องการ reset sequence ทั้งหมด
ALTER SEQUENCE materials_id_seq RESTART WITH 1;

-- วิธีที่ 5: ถ้าตาราง materials มี data อยู่แล้ว ให้ตั้งค่า sequence ใหม่
SELECT setval('materials_id_seq', (SELECT MAX(id) FROM materials) + 1);

-- =====================================================
-- สำหรับตาราง orders (ถ้ามีปัญหาเดียวกัน)
-- =====================================================

-- ตรวจสอบ sequence ของ orders
SELECT 
  c.relname AS table_name,
  a.attname AS column_name,
  pg_get_serial_sequence(c.relname::text, a.attname::text) AS sequence_name
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relname = 'orders' 
AND a.attname = 'id';

-- ตั้งค่า sequence ของ orders
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM orders));

-- ลบข้อมูล id=0 ถ้ามี
DELETE FROM orders WHERE id = 0;

-- =====================================================
-- ตรวจสอบ foreign key constraints ที่อาจขัดข้อง
-- =====================================================

-- ดูว่ามีตารางไหน reference มาที่ materials หรือ orders บ้าง
SELECT 
  tc.table_schema, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name IN ('materials', 'orders');

-- =====================================================
-- คำสั่งที่ควรรันใน Supabase SQL Editor
-- =====================================================

-- 1. เริ่มจากวิธีที่ 1 ก่อน (setval)
SELECT setval('materials_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM materials));

-- 2. ถ้ายังไม่ได้ ลองลบ id=0 (ตรวจสอบ foreign key ก่อน)
-- DELETE FROM materials WHERE id = 0;

-- 3. ถ้ายังไม่ได้ ลอง reset sequence
-- ALTER SEQUENCE materials_id_seq RESTART WITH 1;

-- 4. สำหรับ orders
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM orders));
