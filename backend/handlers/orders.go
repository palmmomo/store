package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// CreateOrder creates an inkjet job order record
func CreateOrder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	userBranchID := middleware.GetBranchID(c)
	role := middleware.GetUserRole(c)

	var req struct {
		BranchID string  `json:"branch_id"`
		Note     string  `json:"note"`
		Total    float64 `json:"total"`
		Payment  string  `json:"payment"`
		Items    []struct {
			Description string  `json:"description"`
			Width        float64 `json:"width"`
			Height       float64 `json:"height"`
			Price        float64 `json:"price"`
			Quantity     int     `json:"quantity"`
			ProductID    string  `json:"product_id"`
		} `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	branchID := req.BranchID
	if role != "superadmin" || branchID == "" {
		branchID = userBranchID
	}

	// Calculate total from items if not provided
	total := req.Total
	if total == 0 {
		for _, item := range req.Items {
			if item.Quantity > 0 {
				total += item.Price * float64(item.Quantity)
			} else {
				total += item.Price
			}
		}
	}

	// Build note from items if not provided
	note := req.Note
	if note == "" && len(req.Items) > 0 {
		for i, item := range req.Items {
			if i > 0 {
				note += " | "
			}
			note += item.Description
			if item.Width > 0 && item.Height > 0 {
				note += fmt.Sprintf(" (%.2fx%.2fm)", item.Width, item.Height)
			}
		}
	}
	if req.Payment != "" {
		note = "ชำระ: " + req.Payment + " | " + note
	}

	orderData := map[string]interface{}{
		"branch_id": branchID,
		"user_id":   userID,
		"total":     total,
		"status":    "completed",
		"note":      note,
	}

	var orders []map[string]interface{}
	if err := db.Client.Insert("orders", orderData, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(orders) == 0 {
		c.JSON(http.StatusCreated, gin.H{"message": "บันทึกสำเร็จ", "total": total})
		return
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
