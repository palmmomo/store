package main

import (
	"log"
	"os"

	"store-backend/db"
	"store-backend/handlers"
	"store-backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var engine *gin.Engine

func initApp() {
	if engine != nil {
		return
	}
	_ = godotenv.Load()
	log.Println("=== STARTUP CHECKS ===")
	log.Printf("SUPABASE_URL: '%s'\n", os.Getenv("SUPABASE_URL"))
	log.Println("======================")
	db.Init()

	if os.Getenv("VERCEL") == "1" {
		gin.SetMode(gin.ReleaseMode)
	}
	engine = gin.Default()

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL, "https://store-psi-bice.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	public := engine.Group("/api")
	{
		public.POST("/auth/login", handlers.Login)
		public.POST("/auth/refresh", handlers.RefreshToken)
		public.POST("/auth/setup", handlers.SetupFirstAdmin)
	}

	api := engine.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Stock items
		stock := api.Group("/stock")
		{
			stock.GET("", handlers.GetStockItems)
			stock.GET("/:id", handlers.GetStockItem)
			stock.POST("", middleware.RequireRole("admin", "accountant"), handlers.CreateStockItem)
			stock.PUT("/:id", middleware.RequireRole("admin"), handlers.UpdateStockItem)
			stock.DELETE("/:id", middleware.RequireRole("admin"), handlers.DeleteStockItem)
		}

		// Purchases
		purchases := api.Group("/purchases")
		purchases.Use(middleware.RequireRole("admin", "accountant"))
		{
			purchases.GET("", handlers.GetPurchases)
			purchases.POST("", handlers.CreatePurchase)
			purchases.PUT("/:id", handlers.UpdatePurchase)
			purchases.DELETE("/:id", handlers.DeletePurchase)
		}

		// Withdrawals
		withdrawals := api.Group("/withdrawals")
		withdrawals.Use(middleware.RequireRole("admin", "technician"))
		{
			withdrawals.GET("", handlers.GetWithdrawals)
			withdrawals.POST("", handlers.CreateWithdrawal)
			withdrawals.PUT("/:id", handlers.UpdateWithdrawal)
			withdrawals.DELETE("/:id", handlers.DeleteWithdrawal)
		}

		// Branches (admin only, except GET for accountant)
		branches := api.Group("/branches")
		{
			branches.GET("", middleware.RequireRole("admin", "accountant"), handlers.GetBranches)
			branches.POST("", middleware.RequireRole("admin"), handlers.CreateBranch)
			branches.PUT("/:id", middleware.RequireRole("admin"), handlers.UpdateBranch)
			branches.DELETE("/:id", middleware.RequireRole("admin"), handlers.DeleteBranch)
		}

		// Quotations (admin + accountant)
		quotations := api.Group("/quotations")
		quotations.Use(middleware.RequireRole("admin", "accountant"))
		{
			quotations.GET("", handlers.GetQuotations)
			quotations.POST("", handlers.CreateQuotation)
			quotations.PUT("/:id", handlers.UpdateQuotation)
			quotations.DELETE("/:id", handlers.DeleteQuotation)
			quotations.POST("/:id/create-job", handlers.CreateJobFromQuotation)
		}

		// Jobs (all roles)
		jobs := api.Group("/jobs")
		{
			jobs.GET("", handlers.GetJobs)
			jobs.POST("", handlers.CreateJob)
			jobs.PUT("/:id", handlers.UpdateJob)
			jobs.DELETE("/:id", handlers.DeleteJob)
		}

		// Dashboard
		api.GET("/dashboard/summary", middleware.RequireRole("admin"), handlers.GetDashboardSummary)

		// Admin
		admin := api.Group("/admin")
		admin.Use(middleware.RequireRole("admin"))
		{
			admin.GET("/users", handlers.GetUsers)
			admin.POST("/users", handlers.CreateUser)
			admin.PUT("/users/:id/role", handlers.UpdateUserRole)
			admin.DELETE("/users/:id", handlers.DeleteUser)
			admin.GET("/history", handlers.GetHistory)
		}
	}
}

func main() {
	initApp()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
