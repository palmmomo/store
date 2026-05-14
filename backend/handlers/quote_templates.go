package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"store-backend/db"

	"github.com/gin-gonic/gin"
)

// GetQuoteTemplate returns the current template for a branch
func GetQuoteTemplate(c *gin.Context) {
	branchID := c.Param("branch_id")

	var results []map[string]interface{}
	query := fmt.Sprintf("select=*&branch_id=eq.%s", branchID)
	if err := db.Client.Query("quote_templates", query, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch template"})
		return
	}

	if len(results) == 0 {
		c.JSON(http.StatusOK, nil)
		return
	}
	c.JSON(http.StatusOK, results[0])
}

// SaveQuoteTemplate upserts the template for a branch
func SaveQuoteTemplate(c *gin.Context) {
	branchID := c.Param("branch_id")
	userID, _ := c.Get("user_id")

	var req struct {
		CanvasJSON json.RawMessage `json:"canvas_json" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if template exists for this branch
	var existing []map[string]interface{}
	checkQuery := fmt.Sprintf("select=id&branch_id=eq.%s", branchID)
	_ = db.Client.Query("quote_templates", checkQuery, &existing)

	data := map[string]interface{}{
		"branch_id":   branchID,
		"canvas_json": req.CanvasJSON,
		"updated_at":  time.Now().UTC().Format(time.RFC3339),
		"updated_by":  userID,
	}

	if len(existing) > 0 {
		// Update existing
		filter := fmt.Sprintf("branch_id=eq.%s", branchID)
		if err := db.Client.Update("quote_templates", filter, data, nil); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to update template: %v", err)})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "updated"})
	} else {
		// Insert new
		var result []map[string]interface{}
		if err := db.Client.Insert("quote_templates", data, &result); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create template: %v", err)})
			return
		}
		if len(result) > 0 {
			c.JSON(http.StatusCreated, result[0])
		} else {
			c.JSON(http.StatusCreated, gin.H{"message": "created"})
		}
	}
}

// GetQuoteDrafts returns all draft versions for a branch
func GetQuoteDrafts(c *gin.Context) {
	branchID := c.Param("branch_id")

	var drafts []map[string]interface{}
	query := fmt.Sprintf("select=id,branch_id,saved_at,saved_by,label&branch_id=eq.%s&order=saved_at.desc", branchID)
	if err := db.Client.Query("quote_drafts", query, &drafts); err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	c.JSON(http.StatusOK, drafts)
}

// CreateQuoteDraft saves a new draft snapshot
func CreateQuoteDraft(c *gin.Context) {
	branchID := c.Param("branch_id")
	userID, _ := c.Get("user_id")

	var req struct {
		CanvasJSON json.RawMessage `json:"canvas_json" binding:"required"`
		Label      string          `json:"label"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{
		"branch_id":   branchID,
		"canvas_json": req.CanvasJSON,
		"saved_at":    time.Now().UTC().Format(time.RFC3339),
		"saved_by":    userID,
		"label":       req.Label,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("quote_drafts", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to save draft: %v", err)})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	}
}

// GetQuoteDraft returns a specific draft with full canvas_json
func GetQuoteDraft(c *gin.Context) {
	branchID := c.Param("branch_id")
	draftID := c.Param("draft_id")

	var results []map[string]interface{}
	query := fmt.Sprintf("select=*&id=eq.%s&branch_id=eq.%s", draftID, branchID)
	if err := db.Client.Query("quote_drafts", query, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch draft"})
		return
	}

	if len(results) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "draft not found"})
		return
	}
	c.JSON(http.StatusOK, results[0])
}

// DeleteQuoteDraft removes a specific draft
func DeleteQuoteDraft(c *gin.Context) {
	branchID := c.Param("branch_id")
	draftID := c.Param("draft_id")

	filter := fmt.Sprintf("id=eq.%s&branch_id=eq.%s", draftID, branchID)
	if err := db.Client.Delete("quote_drafts", filter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("ลบแบบร่างไม่สำเร็จ: %v", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
