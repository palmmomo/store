package models


// Category หมวดหมู่วัสดุ (เช่น งานพิมพ์, โครงสร้าง, งานระบบไฟ)
type Category struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"type:varchar(100);not null" json:"name"`
	Materials []Material `gorm:"foreignKey:CategoryID" json:"materials,omitempty"`
}