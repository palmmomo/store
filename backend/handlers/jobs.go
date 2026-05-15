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
		AssigneeText  string  `json:"assignee_text"`
		QuotationID   *int    `json:"quotation_id"`
		Note          string  `json:"note"`
		StatusText    string  `json:"status_text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	if req.Status == "" {
		req.Status = "pool"
	}
	if req.PaymentStatus == "" {
		req.PaymentStatus = "unpaid"
	}
	data := map[string]interface{}{
		"title": req.Title, "description": req.Description,
		"status": req.Status, "payment_status": req.PaymentStatus,
		"price": req.Price, "created_by": userID,
		"note": req.Note, "status_text": req.StatusText,
		"assignee_text": req.AssigneeText,
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
		AssigneeText  string  `json:"assignee_text"`
		Note          string  `json:"note"`
		StatusText    string  `json:"status_text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data := map[string]interface{}{
		"title": req.Title, "description": req.Description,
		"status": req.Status, "payment_status": req.PaymentStatus,
		"price": req.Price, "updated_at": time.Now(),
		"note": req.Note, "status_text": req.StatusText,
		"assignee_text": req.AssigneeText,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("ลบงานไม่สำเร็จ: %v", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// CreateJobFromQuotation creates one job per line item from a quotation
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
	qIDInt := 0
	if v, ok := q["id"].(float64); ok {
		qIDInt = int(v)
	}

	// Parse items and create one job per line item
	items, ok := q["items"].([]interface{})
	if !ok || len(items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no items in quotation"})
		return
	}

	var createdJobs []map[string]interface{}

	for idx, item := range items {
		m, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		description, _ := m["description"].(string)
		if description == "" {
			description = fmt.Sprintf("รายการ %d", idx+1)
		}
		itemPrice := 0.0
		if t, ok := m["total"].(float64); ok {
			itemPrice = t
		}

		data := map[string]interface{}{
			"title":          description,
			"description":    fmt.Sprintf("จาก QT %s", qNo),
			"price":          itemPrice,
			"status":         "Pool งาน",
			"payment_status": "unpaid",
			"quotation_id":   qIDInt,
			"created_by":     userID,
			"note":           "",
			"assignee_text":  "ช่างทั่วไป",
		}

		var result []map[string]interface{}
		if err := db.Client.Insert("jobs", data, &result); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed creating job for item %d: %v", idx+1, err)})
			return
		}
		if len(result) > 0 {
			createdJobs = append(createdJobs, result[0])
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      fmt.Sprintf("created %d jobs from quotation", len(createdJobs)),
		"jobs_created": len(createdJobs),
		"jobs":         createdJobs,
	})
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
