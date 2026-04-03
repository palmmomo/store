package handlers

import (
	"fmt"
	"net/http"
	"time"

	"store-backend/backend/db"
	"store-backend/backend/middleware"

	"github.com/gin-gonic/gin"
)

// GetDashboard returns dashboard statistics
func GetDashboard(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	branchFilter := ""
	if branchID != "" && branchID != "<nil>" {
		branchFilter = fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	today := time.Now().Format("2006-01-02")

	// Total orders
	var allOrders []map[string]interface{}
	db.Client.Query("orders", "select=id,total,created_at,status&status=eq.completed"+branchFilter, &allOrders)

	totalRevenue := 0.0
	revenueToday := 0.0
	ordersToday := 0

	for _, o := range allOrders {
		t := 0.0
		if v, ok := o["total"].(float64); ok {
			t = v
		}
		totalRevenue += t

		if createdAt, ok := o["created_at"].(string); ok && len(createdAt) >= 10 {
			if createdAt[:10] == today {
				revenueToday += t
				ordersToday++
			}
		}
	}

	// Total products
	var products []map[string]interface{}
	db.Client.Query("products", "select=id&is_active=eq.true"+branchFilter, &products)

	// Low stock items
	var lowStock []map[string]interface{}
	db.Client.Query("stock", "select=id,quantity,min_level"+branchFilter, &lowStock)
	lowStockCount := 0
	for _, s := range lowStock {
		qty := 0.0
		minLevel := 0.0
		if q, ok := s["quantity"].(float64); ok {
			qty = q
		}
		if m, ok := s["min_level"].(float64); ok {
			minLevel = m
		}
		if qty <= minLevel {
			lowStockCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_revenue":   totalRevenue,
		"total_orders":    len(allOrders),
		"total_products":  len(products),
		"low_stock_count": lowStockCount,
		"revenue_today":   revenueToday,
		"orders_today":    ordersToday,
	})
}

// GetSalesChart returns daily sales data for chart
func GetSalesChart(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	// Last 30 days
	startDate := time.Now().AddDate(0, 0, -29).Format("2006-01-02")
	query := fmt.Sprintf("select=total,created_at&status=eq.completed&created_at=gte.%sT00:00:00Z&order=created_at.asc", startDate)
	if branchID != "" && branchID != "<nil>" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	var orders []map[string]interface{}
	if err := db.Client.Query("orders", query, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Aggregate by date
	dateMap := map[string]map[string]interface{}{}
	for i := 0; i < 30; i++ {
		date := time.Now().AddDate(0, 0, -29+i).Format("2006-01-02")
		dateMap[date] = map[string]interface{}{"date": date, "revenue": 0.0, "orders": 0}
	}

	for _, o := range orders {
		if createdAt, ok := o["created_at"].(string); ok && len(createdAt) >= 10 {
			date := createdAt[:10]
			if _, exists := dateMap[date]; exists {
				rev := 0.0
				if v, ok := o["total"].(float64); ok {
					rev = v
				}
				dateMap[date]["revenue"] = dateMap[date]["revenue"].(float64) + rev
				dateMap[date]["orders"] = dateMap[date]["orders"].(int) + 1
			}
		}
	}

	// Convert to sorted slice
	var result []map[string]interface{}
	for i := 0; i < 30; i++ {
		date := time.Now().AddDate(0, 0, -29+i).Format("2006-01-02")
		result = append(result, dateMap[date])
	}

	c.JSON(http.StatusOK, result)
}

// GetSummary returns a revenue summary
func GetSummary(c *gin.Context) {
	role := middleware.GetUserRole(c)
	branchID := middleware.GetBranchID(c)

	queryBranch := c.Query("branch_id")
	if queryBranch != "" && role == "superadmin" {
		branchID = queryBranch
	}

	period := c.DefaultQuery("period", "month") // day, week, month
	var startDate string
	switch period {
	case "day":
		startDate = time.Now().Format("2006-01-02")
	case "week":
		startDate = time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	default:
		startDate = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}

	query := fmt.Sprintf("select=id,total,created_at,status&status=eq.completed&created_at=gte.%sT00:00:00Z&order=created_at.desc", startDate)
	if branchID != "" && branchID != "<nil>" {
		query += fmt.Sprintf("&branch_id=eq.%s", branchID)
	}

	var orders []map[string]interface{}
	if err := db.Client.Query("orders", query, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalRevenue := 0.0
	for _, o := range orders {
		if v, ok := o["total"].(float64); ok {
			totalRevenue += v
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"period":        period,
		"total_orders":  len(orders),
		"total_revenue": totalRevenue,
		"orders":        orders,
	})
}
