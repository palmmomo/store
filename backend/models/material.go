package models

import "time"
type Material struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"type:varchar(150);not null" json:"name"`
	CategoryID    uint      `gorm:"not null" json:"category_id"`
	Category      Category  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"category,omitempty"`
	Unit          string    `gorm:"type:varchar(50);not null" json:"unit"` // หน่วย เช่น ตร.ม., แกลลอน, ชิ้น
	CurrentStock  float64   `gorm:"type:decimal(10,2);default:0" json:"current_stock"`
	MinStockLevel float64   `gorm:"type:decimal(10,2);default:0" json:"min_stock_level"` // จุดแจ้งเตือนของใกล้หมด
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}