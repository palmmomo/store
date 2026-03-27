package models

import "time"

// UsageTransaction ประวัติการเบิกใช้ (ตัดสต๊อก)
type UsageTransaction struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	MaterialID   uint      `gorm:"not null" json:"material_id"`
	Material     Material  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"material,omitempty"`
	JobID        *uint     `json:"job_id"` // อ้างอิง ID ของงาน (ใส่ pointer ไว้เผื่อเป็น null)
	QuantityUsed float64   `gorm:"type:decimal(10,2);not null" json:"quantity_used"` // จำนวนที่เบิก
	UsageDate    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"usage_date"`
	Notes        string    `gorm:"type:text" json:"notes"` // หมายเหตุการเบิก
}