package models

type Supplier struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `gorm:"type:varchar(150);not null" json:"name"`
	Contact  string `gorm:"type:varchar(255)" json:"contact"` // เบอร์โทร หรือ Line
	Address  string `gorm:"type:text" json:"address"`
}