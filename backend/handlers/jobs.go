package handlers

import (
	"fmt"
	"net/http"
	"time"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

func GetJobs(c *gin.Context) {
	var jobs []map[string]interface{}
	if err := db.Client.Query("jobs", "select=*&order=created_at.desc", &jobs); err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

func CreateJob(c *gin.Context) {
	var req struct {
		Title         string  `json:"title" binding:"required"`
		Description   string  `json:"description"`
		Status        string  `json:"status"`
		PaymentStatus string  `json:"payment_status"`
		Price         float64 `json:"price"`
		AssignedTo    string  `json:"assigned_to"`
		QuotationID   *int    `json:"quotation_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	if req.Status == "" {
		req.Status = "รับงาน/ทำแบบ"
	}
	if req.PaymentStatus == "" {
		req.PaymentStatus = "unpaid"
	}
	data := map[string]interface{}{
		"title": req.Title, "description": req.Description,
		"status": req.Status, "payment_status": req.PaymentStatus,
		"price": req.Price, "created_by": userID,
	}
	if req.AssignedTo != "" {
		data["assigned_to"] = req.AssignedTo
	}
	if req.QuotationID != nil {
		data["quotation_id"] = *req.QuotationID
	}
	var result []map[string]interface{}
	if err := db.Client.Insert("jobs", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed: %v", err)})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	}
}

func UpdateJob(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title         string  `json:"title"`
		Description   string  `json:"description"`
		Status        string  `json:"status"`
		PaymentStatus string  `json:"payment_status"`
		Price         float64 `json:"price"`
		AssignedTo    string  `json:"assigned_to"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data := map[string]interface{}{
		"title": req.Title, "description": req.Description,
		"status": req.Status, "payment_status": req.PaymentStatus,
		"price": req.Price, "updated_at": time.Now(),
	}
	if req.AssignedTo != "" {
		data["assigned_to"] = req.AssignedTo
	}
	if err := db.Client.Update("jobs", fmt.Sprintf("id=eq.%s", id), data, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func DeleteJob(c *gin.Context) {
	id := c.Param("id")
	if err := db.Client.Delete("jobs", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// CreateJobFromQuotation creates a job from a quotation
func CreateJobFromQuotation(c *gin.Context) {
	qID := c.Param("id")
	var quotations []map[string]interface{}
	if err := db.Client.Query("quotations", fmt.Sprintf("select=*&id=eq.%s", qID), &quotations); err != nil || len(quotations) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "quotation not found"})
		return
	}
	q := quotations[0]
	userID := middleware.GetUserID(c)

	qNo, _ := q["quotation_no"].(string)
	custName, _ := q["customer_name"].(string)
	totalAmt, _ := q["total_amount"].(float64)
	qIDInt := 0
	if v, ok := q["id"].(float64); ok {
		qIDInt = int(v)
	}

	// Build description from items
	desc := ""
	if items, ok := q["items"].([]interface{}); ok {
		for _, item := range items {
			if m, ok := item.(map[string]interface{}); ok {
				d, _ := m["description"].(string)
				if d != "" {
					if desc != "" {
						desc += ", "
					}
					desc += d
				}
			}
		}
	}

	data := map[string]interface{}{
		"title":          fmt.Sprintf("%s: %s", qNo, custName),
		"description":    desc,
		"price":          totalAmt,
		"status":         "รับงาน/ทำแบบ",
		"payment_status": "unpaid",
		"quotation_id":   qIDInt,
		"created_by":     userID,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("jobs", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed: %v", err)})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "job created from quotation"})
	}
}

// GetDashboardSummary returns financial summary
func GetDashboardSummary(c *gin.Context) {
	var jobs []map[string]interface{}
	_ = db.Client.Query("jobs", "select=price", &jobs)
	var purchases []map[string]interface{}
	_ = db.Client.Query("stock_purchases", "select=total_price", &purchases)

	totalRevenue := 0.0
	for _, j := range jobs {
		if p, ok := j["price"].(float64); ok {
			totalRevenue += p
		}
	}
	totalPurchase := 0.0
	for _, p := range purchases {
		if t, ok := p["total_price"].(float64); ok {
			totalPurchase += t
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_revenue":  totalRevenue,
		"total_purchase": totalPurchase,
		"net_profit":     totalRevenue - totalPurchase,
	})
}
