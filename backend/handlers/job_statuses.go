package handlers

import (
	"fmt"
	"net/http"

	"store-backend/db"
	"github.com/gin-gonic/gin"
)

func GetJobStatuses(c *gin.Context) {
	var statuses []map[string]interface{}
	if err := db.Client.Query("job_statuses", "select=*&order=order_idx.asc", &statuses); err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	c.JSON(http.StatusOK, statuses)
}

func CreateJobStatus(c *gin.Context) {
	var req struct {
		Name     string `json:"name" binding:"required"`
		Color    string `json:"color"`
		OrderIdx int    `json:"order_idx"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Color == "" {
		req.Color = "#ef4444"
	}
	data := map[string]interface{}{
		"name": req.Name, "color": req.Color, "order_idx": req.OrderIdx,
	}
	var result []map[string]interface{}
	if err := db.Client.Insert("job_statuses", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed: %v", err)})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusCreated, result[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	}
}

func UpdateJobStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     string `json:"name"`
		Color    string `json:"color"`
		OrderIdx int    `json:"order_idx"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data := map[string]interface{}{
		"name": req.Name, "color": req.Color, "order_idx": req.OrderIdx,
	}
	if err := db.Client.Update("job_statuses", fmt.Sprintf("id=eq.%s", id), data, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func DeleteJobStatus(c *gin.Context) {
	id := c.Param("id")
	if err := db.Client.Delete("job_statuses", fmt.Sprintf("id=eq.%s", id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
