package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type SupabaseClaims struct {
	Sub          string                 `json:"sub"`
	Email        string                 `json:"email"`
	Role         string                 `json:"role"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
	jwt.RegisteredClaims
}

// AuthMiddleware verifies Supabase JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		tokenStr := parts[1]

		claims := &SupabaseClaims{}
		_, _, err := new(jwt.Parser).ParseUnverified(tokenStr, claims)

		if err != nil {
			fmt.Printf("JWT Parse Error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Extract app_metadata role
		userRole := ""
		if claims.AppMetadata != nil {
			if r, ok := claims.AppMetadata["role"].(string); ok {
				userRole = r
			}
		}

		// Default role
		if userRole == "" {
			userRole = "technician"
		}

		// Set context values
		c.Set("user_id", claims.Sub)
		c.Set("user_email", claims.Email)
		c.Set("user_role", userRole)

		c.Next()
	}
}

// RequireRole middleware checks if user has one of the allowed roles
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		roleStr := fmt.Sprintf("%v", userRole)
		for _, r := range roles {
			if r == roleStr {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		c.Abort()
	}
}

// GetUserID helper to get user ID from context
func GetUserID(c *gin.Context) string {
	v, _ := c.Get("user_id")
	return fmt.Sprintf("%v", v)
}

// GetUserRole helper to get user role from context
func GetUserRole(c *gin.Context) string {
	v, _ := c.Get("user_role")
	return fmt.Sprintf("%v", v)
}

// SupabaseUser represents the user data returned from Supabase Auth
type SupabaseUser struct {
	ID           string                 `json:"id"`
	Email        string                 `json:"email"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
}

// GetSupabaseUser fetches user data from Supabase using admin key
func GetSupabaseUser(userID string) (*SupabaseUser, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/auth/v1/admin/users/%s", supabaseURL, userID), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+serviceKey)
	req.Header.Set("apikey", serviceKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var user SupabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}
