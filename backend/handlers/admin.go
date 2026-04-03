package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"store-backend/backend/db"

	"github.com/gin-gonic/gin"
)

// GetUsers returns all users (superadmin only)
func GetUsers(c *gin.Context) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/auth/v1/admin/users", supabaseURL), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}
	req.Header.Set("Authorization", "Bearer "+serviceKey)
	req.Header.Set("apikey", serviceKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse response"})
		return
	}
	c.JSON(http.StatusOK, result)
}

// UpdateUserRole updates a user's role and branch in app_metadata
func UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")
	var req struct {
		Role     string `json:"role" binding:"required"`
		BranchID string `json:"branch_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	payload, _ := json.Marshal(map[string]interface{}{
		"app_metadata": map[string]interface{}{
			"role":      req.Role,
			"branch_id": req.BranchID,
		},
	})

	httpReq, err := http.NewRequest("PUT",
		fmt.Sprintf("%s/auth/v1/admin/users/%s", supabaseURL, userID),
		bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
	httpReq.Header.Set("apikey", serviceKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	c.JSON(resp.StatusCode, result)
}

// InviteUser invites a new user via Supabase Admin
func InviteUser(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Role     string `json:"role"`
		BranchID string `json:"branch_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	payload, _ := json.Marshal(map[string]interface{}{
		"email": req.Email,
		"app_metadata": map[string]interface{}{
			"role":      req.Role,
			"branch_id": req.BranchID,
		},
	})

	httpReq, err := http.NewRequest("POST",
		fmt.Sprintf("%s/auth/v1/admin/users", supabaseURL),
		bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
	httpReq.Header.Set("apikey", serviceKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to invite user"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	c.JSON(resp.StatusCode, result)
}

// DeleteUser deletes a user from Supabase Auth
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	httpReq, err := http.NewRequest("DELETE",
		fmt.Sprintf("%s/auth/v1/admin/users/%s", supabaseURL, userID), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
	httpReq.Header.Set("apikey", serviceKey)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}
	defer resp.Body.Close()
	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}

// GetActivityLogs returns all stock and order activity
func GetActivityLogs(c *gin.Context) {
	branchFilter := c.Query("branch_id")
	query := "select=*,products(name)&order=created_at.desc&limit=200"
	if branchFilter != "" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchFilter)
	}

	var logs []map[string]interface{}
	if err := db.Client.Query("stock_logs", query, &logs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}
