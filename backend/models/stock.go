package models

import "time"

type Category struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type Supplier struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	Contact string `json:"contact"`
	Address string `json:"address"`
}

type Material struct {
	ID            uint      `json:"id"`
	Name          string    `json:"name"`
	CategoryID    uint      `json:"category_id"`
	Unit          string    `json:"unit"`
	CurrentStock  float64   `json:"current_stock"`
	MinStockLevel float64   `json:"min_stock_level"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type PurchaseTransaction struct {
	ID           uint      `json:"id"`
	MaterialID   uint      `json:"material_id"`
	SupplierID   uint      `json:"supplier_id"`
	Quantity     float64   `json:"quantity"`
	TotalPrice   float64   `json:"total_price"`
	UnitCost     float64   `json:"unit_cost"`
	PurchaseDate time.Time `json:"purchase_date"`
	ReceiptNo    string    `json:"receipt_no"`
}

type UsageTransaction struct {
	ID           uint      `json:"id"`
	MaterialID   uint      `json:"material_id"`
	JobID        *uint     `json:"job_id"`
	QuantityUsed float64   `json:"quantity_used"`
	UsageDate    time.Time `json:"usage_date"`
	Notes        string    `json:"notes"`
}
