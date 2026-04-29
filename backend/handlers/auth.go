package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type supabaseLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type supabaseAuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         struct {
		ID           string                 `json:"id"`
		Email        string                 `json:"email"`
		AppMetadata  map[string]interface{} `json:"app_metadata"`
		UserMetadata map[string]interface{} `json:"user_metadata"`
	} `json:"user"`
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
	Message          string `json:"msg"`
}

// Login authenticates user via Supabase Auth
func Login(c *gin.Context) {
	var req supabaseLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password required"})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")

	payload, _ := json.Marshal(req)
	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", supabaseURL)

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", supabaseAnonKey)
	httpReq.Header.Set("Authorization", "Bearer "+supabaseAnonKey)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to auth service"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var authResp supabaseAuthResponse
	if err := json.Unmarshal(bodyBytes, &authResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse auth response"})
		return
	}

	log.Printf("== LOGIN RESPONSE: STATUS %d ==", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		msg := "invalid login credentials"
		if authResp.ErrorDescription != "" {
			msg = authResp.ErrorDescription
		} else if authResp.Message != "" {
			msg = authResp.Message
		}
		log.Printf("== LOGIN ERROR: %s ==", msg)
		c.JSON(resp.StatusCode, gin.H{"error": msg})
		return
	}

	log.Printf("== LOGIN SUCCESS: USER_ID=%s ==", authResp.User.ID)

	// Extract role from app_metadata
	role := "technician"
	if authResp.User.AppMetadata != nil {
		if r, ok := authResp.User.AppMetadata["role"].(string); ok {
			role = r
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  authResp.AccessToken,
		"refresh_token": authResp.RefreshToken,
		"user": gin.H{
			"id":    authResp.User.ID,
			"email": authResp.User.Email,
			"role":  role,
		},
	})
}

// RefreshToken refreshes the access token
func RefreshToken(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token required"})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")

	payload, _ := json.Marshal(map[string]string{"refresh_token": body.RefreshToken})
	url := fmt.Sprintf("%s/auth/v1/token?grant_type=refresh_token", supabaseURL)

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", supabaseAnonKey)
	httpReq.Header.Set("Authorization", "Bearer "+supabaseAnonKey)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh token"})
		return
	}
	defer resp.Body.Close()

	var authResp supabaseAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse response"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": authResp.ErrorDescription})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  authResp.AccessToken,
		"refresh_token": authResp.RefreshToken,
	})
}

// SetupFirstAdmin is a temporary route to create the very first admin user
func SetupFirstAdmin(c *gin.Context) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	payload, _ := json.Marshal(map[string]interface{}{
		"email":         "admin@admin.com",
		"password":      "admin123456",
		"email_confirm": true,
		"app_metadata": map[string]interface{}{
			"role": "admin",
		},
		"user_metadata": map[string]interface{}{
			"full_name": "Admin",
		},
	})

	httpReq, _ := http.NewRequest("POST",
		fmt.Sprintf("%s/auth/v1/admin/users", supabaseURL),
		bytes.NewBuffer(payload))
	httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
	httpReq.Header.Set("apikey", serviceKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to contact supabase"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		var authResult map[string]interface{}
		json.Unmarshal(body, &authResult)
		c.JSON(resp.StatusCode, authResult)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success! You can now login with admin@admin.com / admin123456"})
}
