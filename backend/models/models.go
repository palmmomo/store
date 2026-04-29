package models

import "time"

// User represents a system user linked to Supabase auth.users
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"` // admin, accountant, technician
	CreatedAt time.Time `json:"created_at"`
}

// StockItem represents an item in inventory
type StockItem struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Unit      string    `json:"unit"`
	Quantity  float64   `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// StockPurchase represents a purchase record (accountant buys stock in)
type StockPurchase struct {
	ID           int       `json:"id"`
	ItemID       int       `json:"item_id"`
	Quantity     float64   `json:"quantity"`
	PricePerUnit float64   `json:"price_per_unit"`
	TotalPrice   float64   `json:"total_price"`
	Supplier     string    `json:"supplier"`
	PurchasedBy  string    `json:"purchased_by"`
	PurchasedAt  time.Time `json:"purchased_at"`
	Note         string    `json:"note"`
	// Joined fields
	ItemName  string `json:"item_name,omitempty"`
	ItemUnit  string `json:"item_unit,omitempty"`
	UserEmail string `json:"user_email,omitempty"`
}

// StockWithdrawal represents a withdrawal record (technician takes stock out)
type StockWithdrawal struct {
	ID          int       `json:"id"`
	ItemID      int       `json:"item_id"`
	Quantity    float64   `json:"quantity"`
	Purpose     string    `json:"purpose"`
	WithdrawnBy string    `json:"withdrawn_by"`
	WithdrawnAt time.Time `json:"withdrawn_at"`
	// Joined fields
	ItemName  string `json:"item_name,omitempty"`
	ItemUnit  string `json:"item_unit,omitempty"`
	UserEmail string `json:"user_email,omitempty"`
}

// Request types

type CreateStockItemRequest struct {
	Name     string  `json:"name" binding:"required"`
	Unit     string  `json:"unit" binding:"required"`
	Quantity float64 `json:"quantity"`
}

type UpdateStockItemRequest struct {
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Quantity float64 `json:"quantity"`
}

type CreatePurchaseRequest struct {
	ItemID       int     `json:"item_id" binding:"required"`
	Quantity     float64 `json:"quantity" binding:"required,gt=0"`
	PricePerUnit float64 `json:"price_per_unit"`
	TotalPrice   float64 `json:"total_price"`
	Supplier     string  `json:"supplier"`
	Note         string  `json:"note"`
}

type CreateWithdrawalRequest struct {
	ItemID   int     `json:"item_id" binding:"required"`
	Quantity float64 `json:"quantity" binding:"required,gt=0"`
	Purpose  string  `json:"purpose"`
}

type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"`
}

type UpdateUserRoleRequest struct {
	Role string `json:"role" binding:"required"`
}
