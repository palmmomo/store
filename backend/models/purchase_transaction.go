package models

import "time"

type PurchaseTransaction struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	MaterialID   uint      `gorm:"not null" json:"material_id"`
	Material     Material  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"material,omitempty"`
	SupplierID   uint      `gorm:"not null" json:"supplier_id"`
	Supplier     Supplier  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"supplier,omitempty"`
	Quantity     float64   `gorm:"type:decimal(10,2);not null" json:"quantity"` // จำนวนที่ซื้อ
	TotalPrice   float64   `gorm:"type:decimal(12,2);not null" json:"total_price"` // ราคารวม
	UnitCost     float64   `gorm:"type:decimal(10,2);not null" json:"unit_cost"` // ต้นทุนต่อหน่วย
	PurchaseDate time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"purchase_date"`
	ReceiptNo    string    `gorm:"type:varchar(100)" json:"receipt_no"` // เลขที่ใบเสร็จ (ถ้ามี)
}