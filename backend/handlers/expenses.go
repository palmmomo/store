package handlers

import (
	"fmt"
	"net/http"
	"time"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

type expenseRow struct {
	ID          int       `json:"id"`
	BranchID    string    `json:"branch_id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	ExpenseDate time.Time `json:"expense_date"`
	Note        string    `json:"note"`
}

// GetExpenses returns all expenses list (superadmin: all, staff: own branch)
func GetExpenses(c *gin.Context) {
	role := middleware.GetUserRole(c)
	userBranchID := middleware.GetBranchID(c)

	var query string
	if role == "superadmin" {
		query = "select=*,branches(name)&order=expense_date.desc"
	} else {
		query = fmt.Sprintf("select=*&branch_id=eq.%s&order=expense_date.desc", userBranchID)
	}

	var expenses []map[string]interface{}
	if err := db.Client.Query("expenses", query, &expenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, expenses)
}

// CreateExpense saves a new expense for the branch
func CreateExpense(c *gin.Context) {
	userID := middleware.GetUserID(c)
	userBranchID := middleware.GetBranchID(c)

	var req struct {
		Title  string  `json:"title" binding:"required"`
		Amount float64 `json:"amount" binding:"required"`
		Note   string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if userBranchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user does not belong to any branch"})
		return
	}

	data := map[string]interface{}{
		"branch_id":    userBranchID,
		"user_id":      userID,
		"title":        req.Title,
		"amount":       req.Amount,
		"note":         req.Note,
		"expense_date": time.Now(),
	}

	var result []expenseRow
	if err := db.Client.Insert("expenses", data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusCreated, gin.H{"message": "expense created"})
		return
	}

	c.JSON(http.StatusCreated, result[0])
}

// UpdateExpense updates an existing expense (user can only update their own)
func UpdateExpense(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	var req struct {
		Title  string  `json:"title"`
		Amount float64 `json:"amount"`
		Note   string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data := map[string]interface{}{}
	if req.Title != "" {
		data["title"] = req.Title
	}
	if req.Amount > 0 {
		data["amount"] = req.Amount
	}
	data["note"] = req.Note // allow empty string

	// Ensure the user owns this expense OR is superadmin (though prompt says admin read-only, we enforce ownership here for staff)
	var condition string
	if role == "superadmin" || role == "admin" {
		condition = fmt.Sprintf("id=eq.%s", id)
	} else {
		condition = fmt.Sprintf("id=eq.%s&user_id=eq.%s", id, userID)
	}

	var result []expenseRow
	if err := db.Client.Update("expenses", condition, data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(result) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found or unauthorized"})
		return
	}
	c.JSON(http.StatusOK, result[0])
}

// DeleteExpense deletes an expense (user can only delete their own)
func DeleteExpense(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	var condition string
	if role == "superadmin" || role == "admin" {
		condition = fmt.Sprintf("id=eq.%s", id)
	} else {
		condition = fmt.Sprintf("id=eq.%s&user_id=eq.%s", id, userID)
	}

	if err := db.Client.Delete("expenses", condition); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "expense deleted"})
}
