package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// CreateOrder creates a POS order and deducts stock
func CreateOrder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	userBranchID := middleware.GetBranchID(c)
	role := middleware.GetUserRole(c)

	var req struct {
		BranchID string `json:"branch_id"`
		Note     string `json:"note"`
		Items    []struct {
			ProductID string  `json:"product_id"`
			Quantity  int     `json:"quantity"`
			Price     float64 `json:"price"`
		} `json:"items" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	branchID := req.BranchID
	if role != "superadmin" {
		branchID = userBranchID
	}

	// Calculate total
	total := 0.0
	for _, item := range req.Items {
		total += item.Price * float64(item.Quantity)
	}

	// Create order
	orderData := map[string]interface{}{
		"branch_id": branchID,
		"user_id":   userID,
		"total":     total,
		"status":    "completed",
		"note":      req.Note,
	}

	var orders []map[string]interface{}
	if err := db.Client.Insert("orders", orderData, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(orders) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	orderID := fmt.Sprintf("%v", orders[0]["id"])

	// Insert order items and deduct stock
	for _, item := range req.Items {
		itemData := map[string]interface{}{
			"order_id":   orderID,
			"product_id": item.ProductID,
			"quantity":   item.Quantity,
			"price":      item.Price,
		}
		db.Client.Insert("order_items", itemData, nil)

		// Deduct stock (best-effort)
		var stocks []map[string]interface{}
		stockQuery := fmt.Sprintf("product_id=eq.%s&branch_id=eq.%s&select=id,quantity", item.ProductID, branchID)
		if err := db.Client.Query("stock", stockQuery, &stocks); err == nil && len(stocks) > 0 {
			stockID := fmt.Sprintf("%v", stocks[0]["id"])
			currentQty := 0
			if q, ok := stocks[0]["quantity"].(float64); ok {
				currentQty = int(q)
			}
			newQty := currentQty - item.Quantity
			if newQty >= 0 {
				db.Client.Update("stock", fmt.Sprintf("id=eq.%s", stockID),
					map[string]interface{}{"quantity": newQty}, nil)

				// Log stock change
				db.Client.Insert("stock_logs", map[string]interface{}{
					"product_id": item.ProductID,
					"branch_id":  branchID,
					"change":     -item.Quantity,
					"reason":     fmt.Sprintf("POS Order #%s", orderID),
					"user_id":    userID,
				}, nil)
			}
		}
	}

	c.JSON(http.StatusCreated, orders[0])
}

// GetOrders returns orders filtered by branch
func GetOrders(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	query := "select=*,order_items(id,quantity,price,products(name,category))&order=created_at.desc&limit=50"
	if branchID != "" && branchID != "<nil>" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	statusFilter := c.Query("status")
	if statusFilter != "" {
		query += fmt.Sprintf("&status=eq.%s", statusFilter)
	}

	var orders []map[string]interface{}
	if err := db.Client.Query("orders", query, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetOrder returns a single order by ID
func GetOrder(c *gin.Context) {
	id := c.Param("id")
	var orders []map[string]interface{}
	query := fmt.Sprintf("id=eq.%s&select=*,order_items(id,quantity,price,products(name,category))", id)
	if err := db.Client.Query("orders", query, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(orders) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, orders[0])
}
