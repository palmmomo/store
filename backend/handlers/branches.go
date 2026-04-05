package handlers

import (
	"fmt"
	"net/http"
	"time"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

type branchRow struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetBranches returns all branches (superadmin: all, others: own branch)
func GetBranches(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	var query string
	if role == "superadmin" {
		query = "select=*&order=created_at.asc"
	} else {
		query = fmt.Sprintf("select=*&id=eq.%s", branchID)
	}

	var branches []branchRow
	if err := db.Client.Query("branches", query, &branches); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, branches)
}

// CreateBranch creates a new branch (superadmin only)
func CreateBranch(c *gin.Context) {
	var req struct {
		Name    string `json:"name" binding:"required"`
		Address string `json:"address"`
		Phone   string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{
		"name":      req.Name,
		"address":   req.Address,
		"phone":     req.Phone,
		"is_active": true,
	}

	var result []branchRow
	if err := db.Client.Insert("branches", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create branch"})
		return
	}
	c.JSON(http.StatusCreated, result[0])
}

// UpdateBranch updates a branch by ID (superadmin only)
func UpdateBranch(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     string `json:"name"`
		Address  string `json:"address"`
		Phone    string `json:"phone"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{}
	if req.Name != "" {
		data["name"] = req.Name
	}
	if req.Address != "" {
		data["address"] = req.Address
	}
	if req.Phone != "" {
		data["phone"] = req.Phone
	}
	if req.IsActive != nil {
		data["is_active"] = *req.IsActive
	}

	var result []branchRow
	if err := db.Client.Update("branches", fmt.Sprintf("id=eq.%s", id), data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "branch not found"})
		return
	}
	c.JSON(http.StatusOK, result[0])
}

// DeleteBranch hard-deletes a branch and its related data (superadmin only)
func DeleteBranch(c *gin.Context) {
	id := c.Param("id")

	if err := db.Client.Delete("branches", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "branch deleted"})
}
