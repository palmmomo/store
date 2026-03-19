package models

import "time"

// Branch represents a restaurant branch
type Branch struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserProfile represents a user with their role and branch
type UserProfile struct {
	ID       string `json:"id"`
	UserID   string `json:"user_id"`
	FullName string `json:"full_name"`
	Role     string `json:"role"` // superadmin, branch_admin, staff
	BranchID string `json:"branch_id"`
	Email    string `json:"email"`
}

// Product represents a product/menu item
type Product struct {
	ID        string    `json:"id"`
	BranchID  string    `json:"branch_id"`
	Name      string    `json:"name"`
	Price     float64   `json:"price"`
	Category  string    `json:"category"`
	ImageURL  string    `json:"image_url"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Stock represents stock level for a product at a branch
type Stock struct {
	ID        string    `json:"id"`
	ProductID string    `json:"product_id"`
	BranchID  string    `json:"branch_id"`
	Quantity  int       `json:"quantity"`
	MinLevel  int       `json:"min_level"`
	Unit      string    `json:"unit"`
	UpdatedAt time.Time `json:"updated_at"`
	Product   *Product  `json:"product,omitempty"`
}

// StockLog represents a stock change event
type StockLog struct {
	ID        string    `json:"id"`
	ProductID string    `json:"product_id"`
	BranchID  string    `json:"branch_id"`
	Change    int       `json:"change"`
	Reason    string    `json:"reason"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Product   *Product  `json:"product,omitempty"`
}

// Order represents a POS order
type Order struct {
	ID         string      `json:"id"`
	BranchID   string      `json:"branch_id"`
	UserID     string      `json:"user_id"`
	Total      float64     `json:"total"`
	Status     string      `json:"status"` // pending, completed, cancelled
	Note       string      `json:"note"`
	Items      []OrderItem `json:"items,omitempty"`
	CreatedAt  time.Time   `json:"created_at"`
}

// OrderItem represents a line item in an order
type OrderItem struct {
	ID        string   `json:"id"`
	OrderID   string   `json:"order_id"`
	ProductID string   `json:"product_id"`
	Quantity  int      `json:"quantity"`
	Price     float64  `json:"price"`
	Product   *Product `json:"product,omitempty"`
}

// Request/Response types

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refresh_token"`
	User         UserProfile `json:"user"`
}

type CreateBranchRequest struct {
	Name    string `json:"name" binding:"required"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
}

type CreateProductRequest struct {
	BranchID string  `json:"branch_id" binding:"required"`
	Name     string  `json:"name" binding:"required"`
	Price    float64 `json:"price" binding:"required,gt=0"`
	Category string  `json:"category"`
	ImageURL string  `json:"image_url"`
}

type UpdateStockRequest struct {
	Change int    `json:"change" binding:"required"`
	Reason string `json:"reason" binding:"required"`
}

type CreateOrderRequest struct {
	BranchID string              `json:"branch_id" binding:"required"`
	Note     string              `json:"note"`
	Items    []OrderItemRequest  `json:"items" binding:"required,min=1"`
}

type OrderItemRequest struct {
	ProductID string `json:"product_id" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,gt=0"`
}

type DashboardStats struct {
	TotalRevenue     float64 `json:"total_revenue"`
	TotalOrders      int     `json:"total_orders"`
	TotalProducts    int     `json:"total_products"`
	LowStockCount    int     `json:"low_stock_count"`
	RevenueToday     float64 `json:"revenue_today"`
	OrdersToday      int     `json:"orders_today"`
}

type SalesChartData struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
	Orders  int     `json:"orders"`
}
