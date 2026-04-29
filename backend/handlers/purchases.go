package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// CreatePurchase records a stock purchase and increases stock quantity
func CreatePurchase(c *gin.Context) {
	var req struct {
		ItemID       int     `json:"item_id" binding:"required"`
		Quantity     float64 `json:"quantity" binding:"required,gt=0"`
		PricePerUnit float64 `json:"price_per_unit"`
		TotalPrice   float64 `json:"total_price"`
		Supplier     string  `json:"supplier"`
		Note         string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)

	if req.PricePerUnit > 0 && req.TotalPrice == 0 {
		req.TotalPrice = req.PricePerUnit * req.Quantity
	}
	if req.TotalPrice > 0 && req.PricePerUnit == 0 && req.Quantity > 0 {
		req.PricePerUnit = req.TotalPrice / req.Quantity
	}

	purchaseData := map[string]interface{}{
		"item_id":        req.ItemID,
		"quantity":       req.Quantity,
		"price_per_unit": req.PricePerUnit,
		"total_price":    req.TotalPrice,
		"supplier":       req.Supplier,
		"purchased_by":   userID,
		"note":           req.Note,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("stock_purchases", purchaseData, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create purchase: %v", err)})
		return
	}

	// Increase stock quantity
	var items []map[string]interface{}
	if err := db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", req.ItemID), &items); err != nil || len(items) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find stock item"})
		return
	}

	currentQty, _ := items[0]["quantity"].(float64)
	_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", req.ItemID), map[string]interface{}{
		"quantity": currentQty + req.Quantity,
	}, nil)

	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "purchase recorded"})
	}
}

// UpdatePurchase edits a purchase and adjusts stock by the diff
func UpdatePurchase(c *gin.Context) {
	id := c.Param("id")

	// Get old purchase
	var oldPurchases []map[string]interface{}
	if err := db.Client.Query("stock_purchases", fmt.Sprintf("select=*&id=eq.%s", id), &oldPurchases); err != nil || len(oldPurchases) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "purchase not found"})
		return
	}
	old := oldPurchases[0]
	oldQty, _ := old["quantity"].(float64)
	oldItemID, _ := old["item_id"].(float64)

	var req struct {
		ItemID       int     `json:"item_id"`
		Quantity     float64 `json:"quantity"`
		PricePerUnit float64 `json:"price_per_unit"`
		TotalPrice   float64 `json:"total_price"`
		Supplier     string  `json:"supplier"`
		Note         string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ItemID == 0 {
		req.ItemID = int(oldItemID)
	}
	if req.PricePerUnit > 0 && req.TotalPrice == 0 {
		req.TotalPrice = req.PricePerUnit * req.Quantity
	}
	if req.TotalPrice > 0 && req.PricePerUnit == 0 && req.Quantity > 0 {
		req.PricePerUnit = req.TotalPrice / req.Quantity
	}

	updateData := map[string]interface{}{
		"item_id":        req.ItemID,
		"quantity":       req.Quantity,
		"price_per_unit": req.PricePerUnit,
		"total_price":    req.TotalPrice,
		"supplier":       req.Supplier,
		"note":           req.Note,
	}

	if err := db.Client.Update("stock_purchases", fmt.Sprintf("id=eq.%s", id), updateData, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update purchase"})
		return
	}

	// Adjust stock: remove old qty, add new qty
	if req.ItemID == int(oldItemID) {
		diff := req.Quantity - oldQty
		if diff != 0 {
			var items []map[string]interface{}
			_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", req.ItemID), &items)
			if len(items) > 0 {
				cur, _ := items[0]["quantity"].(float64)
				_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", req.ItemID), map[string]interface{}{"quantity": cur + diff}, nil)
			}
		}
	} else {
		// Different item — revert old, apply new
		var oldItems []map[string]interface{}
		_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", int(oldItemID)), &oldItems)
		if len(oldItems) > 0 {
			cur, _ := oldItems[0]["quantity"].(float64)
			_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", int(oldItemID)), map[string]interface{}{"quantity": cur - oldQty}, nil)
		}
		var newItems []map[string]interface{}
		_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", req.ItemID), &newItems)
		if len(newItems) > 0 {
			cur, _ := newItems[0]["quantity"].(float64)
			_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", req.ItemID), map[string]interface{}{"quantity": cur + req.Quantity}, nil)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "purchase updated"})
}

// DeletePurchase deletes a purchase and reverts stock
func DeletePurchase(c *gin.Context) {
	id := c.Param("id")

	var purchases []map[string]interface{}
	if err := db.Client.Query("stock_purchases", fmt.Sprintf("select=*&id=eq.%s", id), &purchases); err != nil || len(purchases) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "purchase not found"})
		return
	}

	p := purchases[0]
	qty, _ := p["quantity"].(float64)
	itemID, _ := p["item_id"].(float64)

	if err := db.Client.Delete("stock_purchases", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete purchase"})
		return
	}

	// Revert stock
	var items []map[string]interface{}
	_ = db.Client.Query("stock_items", fmt.Sprintf("select=quantity&id=eq.%d", int(itemID)), &items)
	if len(items) > 0 {
		cur, _ := items[0]["quantity"].(float64)
		_ = db.Client.Update("stock_items", fmt.Sprintf("id=eq.%d", int(itemID)), map[string]interface{}{"quantity": cur - qty}, nil)
	}

	c.JSON(http.StatusOK, gin.H{"message": "purchase deleted, stock reverted"})
}

// GetPurchases returns purchase history
func GetPurchases(c *gin.Context) {
	var purchases []map[string]interface{}
	// Remove users(email) because purchased_by points to auth.users, which PostgREST cannot join automatically.
	query := "select=*,stock_items(name,unit)&order=purchased_at.desc&limit=200"
	if err := db.Client.Query("stock_purchases", query, &purchases); err != nil {
		fmt.Printf("GetPurchases Error: %v\n", err)
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
	for i, p := range purchases {
		if si, ok := p["stock_items"].(map[string]interface{}); ok {
			if name, ok := si["name"].(string); ok {
				p["item_name"] = name
			}
			if unit, ok := si["unit"].(string); ok {
				p["item_unit"] = unit
			}
		}
		
		// Map user email
		if userID, ok := p["purchased_by"].(string); ok {
			if email, exists := userMap[userID]; exists {
				p["purchased_by_email"] = email
			}
		}
		
		purchases[i] = p
	}

	c.JSON(http.StatusOK, purchases)
}
