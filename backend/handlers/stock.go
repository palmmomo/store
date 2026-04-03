package handlers

import (
	"fmt"
	"net/http"

	"store-backend/backend/db"
	"store-backend/backend/middleware"

	"github.com/gin-gonic/gin"
)

// GetStock returns stock items for a branch
func GetStock(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	query := "select=*,products(id,name,category,price,image_url)&order=products(name).asc"
	if branchID != "" && branchID != "<nil>" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	var stock []map[string]interface{}
	if err := db.Client.Query("stock", query, &stock); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stock)
}

// UpdateStock adjusts stock quantity and creates a log entry
func UpdateStock(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	branchID := middleware.GetBranchID(c)

	var req struct {
		Change int    `json:"change" binding:"required"`
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch current stock
	var stocks []map[string]interface{}
	if err := db.Client.Query("stock", fmt.Sprintf("id=eq.%s&select=*", id), &stocks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(stocks) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "stock item not found"})
		return
	}

	current := stocks[0]
	currentQty := 0
	if q, ok := current["quantity"].(float64); ok {
		currentQty = int(q)
	}

	newQty := currentQty + req.Change
	if newQty < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient stock"})
		return
	}

	// Update stock quantity
	var updated []map[string]interface{}
	if err := db.Client.Update("stock", fmt.Sprintf("id=eq.%s", id),
		map[string]interface{}{"quantity": newQty}, &updated); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create log entry
	productID := ""
	if pid, ok := current["product_id"].(string); ok {
		productID = pid
	}
	if branchID == "" || branchID == "<nil>" {
		if bid, ok := current["branch_id"].(string); ok {
			branchID = bid
		}
	}

	logData := map[string]interface{}{
		"product_id": productID,
		"branch_id":  branchID,
		"change":     req.Change,
		"reason":     req.Reason,
		"user_id":    userID,
	}
	db.Client.Insert("stock_logs", logData, nil) // best-effort log

	if len(updated) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update stock"})
		return
	}
	c.JSON(http.StatusOK, updated[0])
}

// GetStockLogs returns stock change history
func GetStockLogs(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	query := "select=*,products(name,category)&order=created_at.desc&limit=100"
	if branchID != "" && branchID != "<nil>" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	var logs []map[string]interface{}
	if err := db.Client.Query("stock_logs", query, &logs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// CreateStockEntry creates an initial stock entry for a product
func CreateStockEntry(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		BranchID  string `json:"branch_id"`
		Quantity  int    `json:"quantity"`
		MinLevel  int    `json:"min_level"`
		Unit      string `json:"unit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)
	if role != "superadmin" {
		req.BranchID = branchID
	}

	data := map[string]interface{}{
		"product_id": req.ProductID,
		"branch_id":  req.BranchID,
		"quantity":   req.Quantity,
		"min_level":  req.MinLevel,
		"unit":       req.Unit,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("stock", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create stock entry"})
		return
	}
	c.JSON(http.StatusCreated, result[0])
}
