package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"store-backend/db"

	"github.com/gin-gonic/gin"
)

// GetUsers returns all users (admin only)
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

// UpdateUserRole updates a user's role in app_metadata
func UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validRoles := map[string]bool{"admin": true, "accountant": true, "technician": true, "designer": true}
	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be admin, accountant, technician, or designer"})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	payload, _ := json.Marshal(map[string]interface{}{
		"app_metadata": map[string]interface{}{
			"role": req.Role,
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

	// Also update users table
	_ = db.Client.Update("users", fmt.Sprintf("id=eq.%s", userID), map[string]interface{}{
		"role": req.Role,
	}, nil)

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	c.JSON(resp.StatusCode, result)
}

// CreateUser creates a new user with email+password via Supabase Admin API
func CreateUser(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role == "" {
		req.Role = "technician"
	}

	validRoles := map[string]bool{"admin": true, "accountant": true, "technician": true, "designer": true}
	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be admin, accountant, technician, or designer"})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	// 1. Create user in Supabase Auth
	payload, _ := json.Marshal(map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
		"app_metadata": map[string]interface{}{
			"role": req.Role,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var authResult map[string]interface{}
	json.Unmarshal(body, &authResult)

	if resp.StatusCode >= 400 {
		c.JSON(resp.StatusCode, authResult)
		return
	}

	// 2. Insert into users table
	userID, _ := authResult["id"].(string)
	if userID != "" {
		userData := map[string]interface{}{
			"id":    userID,
			"email": req.Email,
			"role":  req.Role,
		}
		_ = db.Client.Insert("users", userData, nil)
	}

	c.JSON(http.StatusCreated, authResult)
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

	// Also delete from users table
	_ = db.Client.Delete("users", fmt.Sprintf("id=eq.%s", userID))

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}
