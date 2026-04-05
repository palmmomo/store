package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// GetProducts returns products filtered by branch
func GetProducts(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	query := "select=*&is_active=eq.true&order=category.asc,name.asc"
	if branchID != "" && branchID != "<nil>" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	var products []map[string]interface{}
	if err := db.Client.Query("products", query, &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetProduct returns a single product by ID
func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var products []map[string]interface{}
	if err := db.Client.Query("products", fmt.Sprintf("id=eq.%s&select=*", id), &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(products) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, products[0])
}

// CreateProduct creates a new product
func CreateProduct(c *gin.Context) {
	role := middleware.GetUserRole(c)
	userBranchID := middleware.GetBranchID(c)

	var req struct {
		BranchID string  `json:"branch_id"`
		Name     string  `json:"name" binding:"required"`
		Price    float64 `json:"price" binding:"required,gt=0"`
		Category string  `json:"category"`
		ImageURL string  `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Non-superadmin can only create products for their own branch
	branchID := req.BranchID
	if role != "superadmin" {
		branchID = userBranchID
	}

	data := map[string]interface{}{
		"branch_id": branchID,
		"name":      req.Name,
		"price":     req.Price,
		"category":  req.Category,
		"image_url": req.ImageURL,
		"is_active": true,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("products", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
		return
	}
	c.JSON(http.StatusCreated, result[0])
}

// UpdateProduct updates a product
func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     string  `json:"name"`
		Price    float64 `json:"price"`
		Category string  `json:"category"`
		ImageURL string  `json:"image_url"`
		IsActive *bool   `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{}
	if req.Name != "" {
		data["name"] = req.Name
	}
	if req.Price > 0 {
		data["price"] = req.Price
	}
	if req.Category != "" {
		data["category"] = req.Category
	}
	if req.ImageURL != "" {
		data["image_url"] = req.ImageURL
	}
	if req.IsActive != nil {
		data["is_active"] = *req.IsActive
	}

	var result []map[string]interface{}
	if err := db.Client.Update("products", fmt.Sprintf("id=eq.%s", id), data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, result[0])
}

// DeleteProduct soft-deletes a product
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	data := map[string]interface{}{"is_active": false}

	if err := db.Client.Update("products", fmt.Sprintf("id=eq.%s", id), data, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}
