package main

import (
	"log"
	"os"

	"store-backend/backend/db"
	"store-backend/backend/handlers"
	"store-backend/backend/middleware"

	"store-backend/backend/repository"
	"store-backend/backend/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file robustly
	err := godotenv.Load()
	if err != nil {
		log.Println("WARNING: Could not load .env file:", err)
		// Try to fallback to ../frontend/.env or ./.env.local if they exist
		_ = godotenv.Load("../frontend/.env")
	}
	
	log.Println("=== STARTUP CHECKS ===")
	log.Printf("SUPABASE_URL: '%s'\n", os.Getenv("SUPABASE_URL"))
	if os.Getenv("SUPABASE_URL") == "" {
		log.Println("👉 ERROR: SUPABASE_URL is EMPTY! The backend will not work properly.")
	}
	log.Println("======================")
	// Init Supabase client
	db.Init()

	stockRepo := repository.NewStockRepository()
	stockService := service.NewStockService(stockRepo)
	stockHandler := handlers.NewStockHandler(stockService)

	// Setup Gin
	r := gin.Default()

	// CORS configuration
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	public := r.Group("/api")
	{
		public.POST("/auth/login", handlers.Login)
		public.POST("/auth/refresh", handlers.RefreshToken)
		public.POST("/auth/setup", handlers.SetupFirstAdmin)
	}

	// Protected routes (require JWT)
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Branch routes
		branches := api.Group("/branches")
		{
			branches.GET("", handlers.GetBranches)
			branches.POST("", middleware.RequireRole("superadmin"), handlers.CreateBranch)
			branches.PUT("/:id", middleware.RequireRole("superadmin"), handlers.UpdateBranch)
			branches.DELETE("/:id", middleware.RequireRole("superadmin"), handlers.DeleteBranch)
		}

		// Product routes
		products := api.Group("/products")
		{
			products.GET("", handlers.GetProducts)
			products.GET("/:id", handlers.GetProduct)
			products.POST("", middleware.RequireRole("superadmin", "branch_admin"), handlers.CreateProduct)
			products.PUT("/:id", middleware.RequireRole("superadmin", "branch_admin"), handlers.UpdateProduct)
			products.DELETE("/:id", middleware.RequireRole("superadmin", "branch_admin"), handlers.DeleteProduct)
		}

		// Stock routes
		stock := api.Group("/stock")
		{
			// Master Data
			stock.POST("/items", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.CreateStockItem)
			stock.GET("", stockHandler.GetStock)
			stock.GET("/items/:id", stockHandler.GetStockByID)
			stock.PUT("/items/:id", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.UpdateStockItem)
			stock.DELETE("/items/:id", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.DeleteStockItem)

			// Transactions
			stock.POST("/purchase", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.PurchaseStock)
			stock.POST("/deduct", stockHandler.DeductStock)
			stock.GET("/compare/:material_id", stockHandler.GetComparison)
		}

		// Order/POS routes
		orders := api.Group("/orders")
		{
			orders.GET("", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetOrders)
			orders.GET("/:id", handlers.GetOrder)
			orders.POST("", handlers.CreateOrder)
		}

		// Stats routes
		stats := api.Group("/stats")
		{
			stats.GET("/dashboard", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetDashboard)
			stats.GET("/chart", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetSalesChart)
			stats.GET("/summary", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetSummary)
		}

		// Admin routes (superadmin only)
		admin := api.Group("/admin")
		admin.Use(middleware.RequireRole("superadmin"))
		{
			admin.GET("/users", handlers.GetUsers)
			admin.POST("/users", handlers.CreateUser)
			admin.PUT("/users/:id/role", handlers.UpdateUserRole)
			admin.DELETE("/users/:id", handlers.DeleteUser)
			admin.GET("/logs", handlers.GetActivityLogs)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
