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
		"payment":   req.Payment,
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

// GetOrders returns orders filtered by branch — all roles can access, filtered by their branch
func GetOrders(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	// Superadmin can query any branch
	queryBranch := c.Query("branch_id")
	if queryBranch != "" && (role == "superadmin" || role == "branch_admin") {
		branchID = queryBranch
	}

	// Staff always sees only their branch
	if role == "staff" {
		// branchID is already set from JWT, ignore query param
	}

	query := "select=*&order=created_at.desc&limit=100"
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
	query := fmt.Sprintf("id=eq.%s&select=*", id)
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

// UpdateOrder updates an existing order (staff can only update their own branch's orders)
func UpdateOrder(c *gin.Context) {
	id := c.Param("id")
	role := middleware.GetUserRole(c)
	userBranchID := middleware.GetBranchID(c)

	var req struct {
		Note    string  `json:"note"`
		Total   float64 `json:"total"`
		Payment string  `json:"payment"`
		Items   []struct {
			Description string  `json:"description"`
			Width        float64 `json:"width"`
			Height       float64 `json:"height"`
			Price        float64 `json:"price"`
			Quantity     int     `json:"quantity"`
		} `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Recalculate total from items
	total := req.Total
	if total == 0 && len(req.Items) > 0 {
		for _, item := range req.Items {
			if item.Quantity > 0 {
				total += item.Price * float64(item.Quantity)
			} else {
				total += item.Price
			}
		}
	}

	// Rebuild note
	note := req.Note
	if note == "" && len(req.Items) > 0 {
		for i, item := range req.Items {
			if i > 0 {
				note += " | "
			}
			note += item.Description
		}
	}
	if req.Payment != "" {
		note = "ชำระ: " + req.Payment + " | " + note
	}

	data := map[string]interface{}{
		"total":   total,
		"note":    note,
		"payment": req.Payment,
	}

	// Filter by branch for staff
	var condition string
	if role == "superadmin" || role == "branch_admin" {
		condition = fmt.Sprintf("id=eq.%s", id)
	} else {
		condition = fmt.Sprintf("id=eq.%s&branch_id=eq.%s", id, userBranchID)
	}

	var result []map[string]interface{}
	if err := db.Client.Update("orders", condition, data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(result) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found or unauthorized"})
		return
	}
	c.JSON(http.StatusOK, result[0])
}

// DeleteOrder deletes an order (staff can only delete their own branch's orders)
func DeleteOrder(c *gin.Context) {
	id := c.Param("id")
	role := middleware.GetUserRole(c)
	userBranchID := middleware.GetBranchID(c)

	var condition string
	if role == "superadmin" || role == "branch_admin" {
		condition = fmt.Sprintf("id=eq.%s", id)
	} else {
		condition = fmt.Sprintf("id=eq.%s&branch_id=eq.%s", id, userBranchID)
	}

	if err := db.Client.Delete("orders", condition); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบรายการสำเร็จ"})
}
