package handlers

import (
	"fmt"
	"net/http"
	"time"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// GetStockItems returns all stock items
func GetStockItems(c *gin.Context) {
	var items []map[string]interface{}
	if err := db.Client.Query("stock_items", "select=*&order=name.asc", &items); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stock items"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GetStockItem returns a single stock item by ID
func GetStockItem(c *gin.Context) {
	id := c.Param("id")
	var items []map[string]interface{}
	if err := db.Client.Query("stock_items", fmt.Sprintf("select=*&id=eq.%s", id), &items); err != nil || len(items) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "stock item not found"})
		return
	}
	c.JSON(http.StatusOK, items[0])
}

// CreateStockItem creates a new stock item (admin only)
func CreateStockItem(c *gin.Context) {
	var req struct {
		Name     string  `json:"name" binding:"required"`
		Unit     string  `json:"unit" binding:"required"`
		Quantity float64 `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{
		"name":     req.Name,
		"unit":     req.Unit,
		"quantity": req.Quantity,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("stock_items", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create stock item: %v", err)})
		return
	}

	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	}
}

// UpdateStockItem updates a stock item (admin only)
func UpdateStockItem(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     *string  `json:"name"`
		Unit     *string  `json:"unit"`
		Quantity *float64 `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.Unit != nil {
		data["unit"] = *req.Unit
	}
	if req.Quantity != nil {
		data["quantity"] = *req.Quantity
	}

	var result []map[string]interface{}
	if err := db.Client.Update("stock_items", fmt.Sprintf("id=eq.%s", id), data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to update stock item: %v", err)})
		return
	}

	if len(result) > 0 {
		c.JSON(http.StatusOK, result[0])
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "updated"})
	}
}

// DeleteStockItem deletes a stock item (admin only)
func DeleteStockItem(c *gin.Context) {
	id := c.Param("id")
	if err := db.Client.Delete("stock_items", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete stock item"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GetHistory returns all purchases and withdrawals for admin view
func GetHistory(c *gin.Context) {
	_ = middleware.GetUserRole(c)

	var purchases []map[string]interface{}
	_ = db.Client.Query("stock_purchases", "select=*,stock_items(name,unit),users(email)&order=purchased_at.desc&limit=200", &purchases)

	var withdrawals []map[string]interface{}
	_ = db.Client.Query("stock_withdrawals", "select=*,stock_items(name,unit),users(email)&order=withdrawn_at.desc&limit=200", &withdrawals)

	c.JSON(http.StatusOK, gin.H{
		"purchases":   purchases,
		"withdrawals": withdrawals,
	})
}
