package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// CreateWithdrawal records a stock withdrawal and decreases stock quantity
func CreateWithdrawal(c *gin.Context) {
	var req struct {
		ItemID   int     `json:"item_id" binding:"required"`
		Quantity float64 `json:"quantity" binding:"required,gt=0"`
		Purpose  string  `json:"purpose"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)

	var items []map[string]interface{}
	if err := db.Client.Query("stock_items", fmt.Sprintf("select=quantity,name&id=eq.%d", req.ItemID), &items); err != nil || len(items) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "stock item not found"})
		return
	}

	currentQty, _ := items[0]["quantity"].(float64)
	if currentQty < req.Quantity {
		itemName, _ := items[0]["name"].(string)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("สต็อกไม่พอ: %s คงเหลือ %.2f", itemName, currentQty)})
		return
	}

	withdrawalData := map[string]interface{}{
		"item_id":      req.ItemID,
		"quantity":     req.Quantity,
		"purpose":      req.Purpose,
		"withdrawn_by": userID,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("stock_withdrawals", withdrawalData, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create withdrawal: %v", err)})
		return
	}

	_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", req.ItemID), map[string]interface{}{
		"quantity": currentQty - req.Quantity,
	}, nil)

	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "withdrawal recorded"})
	}
}

// UpdateWithdrawal edits a withdrawal and adjusts stock by the diff
func UpdateWithdrawal(c *gin.Context) {
	id := c.Param("id")

	var oldWithdrawals []map[string]interface{}
	if err := db.Client.Query("stock_withdrawals", fmt.Sprintf("select=*&id=eq.%s", id), &oldWithdrawals); err != nil || len(oldWithdrawals) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "withdrawal not found"})
		return
	}
	old := oldWithdrawals[0]
	oldQty, _ := old["quantity"].(float64)
	oldItemID, _ := old["item_id"].(float64)

	var req struct {
		ItemID   int     `json:"item_id"`
		Quantity float64 `json:"quantity"`
		Purpose  string  `json:"purpose"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ItemID == 0 {
		req.ItemID = int(oldItemID)
	}

	updateData := map[string]interface{}{
		"item_id":  req.ItemID,
		"quantity": req.Quantity,
		"purpose":  req.Purpose,
	}

	if err := db.Client.Update("stock_withdrawals", fmt.Sprintf("id=eq.%s", id), updateData, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update withdrawal"})
		return
	}

	// Adjust stock: add back old qty, subtract new qty
	if req.ItemID == int(oldItemID) {
		diff := req.Quantity - oldQty // positive means more withdrawn
		if diff != 0 {
			var items []map[string]interface{}
			_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", req.ItemID), &items)
			if len(items) > 0 {
				cur, _ := items[0]["quantity"].(float64)
				_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", req.ItemID), map[string]interface{}{"quantity": cur - diff}, nil)
			}
		}
	} else {
		// Different item — revert old, apply new
		var oldItems []map[string]interface{}
		_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", int(oldItemID)), &oldItems)
		if len(oldItems) > 0 {
			cur, _ := oldItems[0]["quantity"].(float64)
			_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", int(oldItemID)), map[string]interface{}{"quantity": cur + oldQty}, nil)
		}
		var newItems []map[string]interface{}
		_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", req.ItemID), &newItems)
		if len(newItems) > 0 {
			cur, _ := newItems[0]["quantity"].(float64)
			_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", req.ItemID), map[string]interface{}{"quantity": cur - req.Quantity}, nil)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "withdrawal updated"})
}

// DeleteWithdrawal deletes a withdrawal and reverts stock
func DeleteWithdrawal(c *gin.Context) {
	id := c.Param("id")

	var withdrawals []map[string]interface{}
	if err := db.Client.Query("stock_withdrawals", fmt.Sprintf("select=*&id=eq.%s", id), &withdrawals); err != nil || len(withdrawals) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "withdrawal not found"})
		return
	}

	w := withdrawals[0]
	qty, _ := w["quantity"].(float64)
	itemID, _ := w["item_id"].(float64)

	if err := db.Client.Delete("stock_withdrawals", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete withdrawal"})
		return
	}

	// Revert stock (add back)
	var items []map[string]interface{}
	_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", int(itemID)), &items)
	if len(items) > 0 {
		cur, _ := items[0]["quantity"].(float64)
		_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", int(itemID)), map[string]interface{}{"quantity": cur + qty}, nil)
	}

	c.JSON(http.StatusOK, gin.H{"message": "withdrawal deleted, stock reverted"})
}

// GetWithdrawals returns withdrawal history
func GetWithdrawals(c *gin.Context) {
	var withdrawals []map[string]interface{}
	// Remove users(email) because withdrawn_by points to auth.users, which PostgREST cannot join automatically.
	query := "select=*,stock_items(name,unit)&order=withdrawn_at.desc&limit=200"
	if err := db.Client.Query("stock_withdrawals", query, &withdrawals); err != nil {
		fmt.Printf("GetWithdrawals Error: %v\n", err)
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}

	// Fetch users manually to join emails
	var users []map[string]interface{}
	userMap := make(map[string]string)
	if err := db.Client.Query("users", "select=id,email", &users); err == nil {
		for _, u := range users {
			if id, ok := u["id"].(string); ok {
				if email, ok := u["email"].(string); ok {
					userMap[id] = email
				}
			}
		}
	}

	// Flatten fields for frontend
	for i, w := range withdrawals {
		if si, ok := w["stock_items"].(map[string]interface{}); ok {
			if name, ok := si["name"].(string); ok {
				w["item_name"] = name
			}
			if unit, ok := si["unit"].(string); ok {
				w["item_unit"] = unit
			}
		}
		
		// Map user email
		if userID, ok := w["withdrawn_by"].(string); ok {
			if email, exists := userMap[userID]; exists {
				w["withdrawn_by_email"] = email
			}
		}
		
		withdrawals[i] = w
	}

	c.JSON(http.StatusOK, withdrawals)
}
