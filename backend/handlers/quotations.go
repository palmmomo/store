package handlers

import (
	"fmt"
	"net/http"
	"time"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

func GetQuotations(c *gin.Context) {
	var q []map[string]interface{}
	if err := db.Client.Query("quotations", "select=*,branches(name)&order=created_at.desc&limit=200", &q); err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	c.JSON(http.StatusOK, q)
}

func CreateQuotation(c *gin.Context) {
	var req struct {
		BranchID        int                      `json:"branch_id"`
		CustomerName    string                   `json:"customer_name"`
		CustomerAddress string                   `json:"customer_address"`
		CustomerTaxID   string                   `json:"customer_tax_id"`
		Items           []map[string]interface{} `json:"items"`
		TotalAmount     float64                  `json:"total_amount"`
		TotalInWords    string                   `json:"total_in_words"`
		Status          string                   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	qNo := fmt.Sprintf("QT-%s", time.Now().Format("20060102-150405"))
	if req.Status == "" {
		req.Status = "draft"
	}
	data := map[string]interface{}{
		"quotation_no": qNo, "branch_id": req.BranchID,
		"customer_name": req.CustomerName, "customer_address": req.CustomerAddress,
		"customer_tax_id": req.CustomerTaxID, "items": req.Items,
		"total_amount": req.TotalAmount, "total_in_words": req.TotalInWords,
		"status": req.Status, "created_by": userID,
	}
	var result []map[string]interface{}
	if err := db.Client.Insert("quotations", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed: %v", err)})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	}
}

func UpdateQuotation(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		BranchID        int                      `json:"branch_id"`
		CustomerName    string                   `json:"customer_name"`
		CustomerAddress string                   `json:"customer_address"`
		CustomerTaxID   string                   `json:"customer_tax_id"`
		Items           []map[string]interface{} `json:"items"`
		TotalAmount     float64                  `json:"total_amount"`
		TotalInWords    string                   `json:"total_in_words"`
		Status          string                   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data := map[string]interface{}{
		"branch_id": req.BranchID, "customer_name": req.CustomerName,
		"customer_address": req.CustomerAddress, "customer_tax_id": req.CustomerTaxID,
		"items": req.Items, "total_amount": req.TotalAmount,
		"total_in_words": req.TotalInWords, "status": req.Status,
	}
	if err := db.Client.Update("quotations", fmt.Sprintf("id=eq.%s", id), data, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func DeleteQuotation(c *gin.Context) {
	id := c.Param("id")
	if err := db.Client.Delete("quotations", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบใบเสนอราคาได้ เนื่องจากกำลังถูกอ้างอิงในการดำเนินงาน (Jobs)"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
