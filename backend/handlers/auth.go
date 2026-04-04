package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
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
	Message          string `json:"msg"` // ดักไว้สำหรับบางเคสที่ Supabase ส่ง msg มาแทน
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
	// URL สำหรับยิงไปที่ GoTrue (Auth service) ของ Supabase
	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", supabaseURL)

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	// บรรทัดที่ต้องมีเพื่อให้ Supabase อนุญาตให้เข้าถึง API
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

	// เช็คว่า Supabase ตอบกลับมาสำเร็จ (200) หรือไม่
	if resp.StatusCode != http.StatusOK {
		msg := "invalid login credentials"
		if authResp.ErrorDescription != "" {
			msg = authResp.ErrorDescription
		} else if authResp.Message != "" {
			msg = authResp.Message
		}
		c.JSON(resp.StatusCode, gin.H{"error": msg})
		return
	}

	// Extract role and branch from app_metadata (ข้อมูลที่เรา Update ใน SQL Editor)
	role := "staff"
	branchID := ""
	if authResp.User.AppMetadata != nil {
		if r, ok := authResp.User.AppMetadata["role"].(string); ok {
			role = r
		}
		if b, ok := authResp.User.AppMetadata["branch_id"].(string); ok {
			branchID = b
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  authResp.AccessToken,
		"refresh_token": authResp.RefreshToken,
		"user": gin.H{
			"id":        authResp.User.ID,
			"email":     authResp.User.Email,
			"role":      role,
			"branch_id": branchID,
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
