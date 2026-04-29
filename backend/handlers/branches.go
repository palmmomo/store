package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"

	"github.com/gin-gonic/gin"
)

func GetBranches(c *gin.Context) {
	var branches []map[string]interface{}
	if err := db.Client.Query("branches", "select=*&order=name.asc", &branches); err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	c.JSON(http.StatusOK, branches)
}

func CreateBranch(c *gin.Context) {
	var req struct {
		Name    string `json:"name" binding:"required"`
		Address string `json:"address"`
		Phone   string `json:"phone"`
		TaxID   string `json:"tax_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{
		"name": req.Name, "address": req.Address,
		"phone": req.Phone, "tax_id": req.TaxID,
	}

	var result []map[string]interface{}
	if err := db.Client.Insert("branches", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create branch: %v", err)})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	}
}

func UpdateBranch(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name    string `json:"name"`
		Address string `json:"address"`
		Phone   string `json:"phone"`
		TaxID   string `json:"tax_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{
		"name": req.Name, "address": req.Address,
		"phone": req.Phone, "tax_id": req.TaxID,
	}

	if err := db.Client.Update("branches", fmt.Sprintf("id=eq.%s", id), data, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update branch"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func DeleteBranch(c *gin.Context) {
	id := c.Param("id")
	if err := db.Client.Delete("branches", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบสาขาได้ เนื่องจากมีการอ้างอิงในเอกสารอื่น (เช่น ใบเสนอราคา)"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
