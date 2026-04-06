package main

import (
	"log"
	"net/http"
	"os"

	"store-backend/db"
	"store-backend/handlers"
	"store-backend/middleware"

	"store-backend/repository"
	"store-backend/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var engine *gin.Engine

func init() {
	// Minimal init if needed, but we'll do lazy init in Handler or full init in main
}

func initApp() {
	if engine != nil {
		return
	}

	// Load .env file robustly
	err := godotenv.Load()
	if err != nil {
		// Try to fallback to ../frontend/.env or ./.env.local if they exist
		_ = godotenv.Load("../frontend/.env")
	}
	
	log.Println("=== STARTUP CHECKS ===")
	log.Printf("SUPABASE_URL: '%s'\n", os.Getenv("SUPABASE_URL"))
	if os.Getenv("SUPABASE_URL") == "" {
		log.Println("👉 WARNING: SUPABASE_URL is EMPTY!")
	}
	log.Println("======================")

	// Init Supabase client
	db.Init()

	stockRepo := repository.NewStockRepository()
	stockService := service.NewStockService(stockRepo)
	stockHandler := handlers.NewStockHandler(stockService)

	// Setup Gin
	// Use ReleaseMode on Vercel to save logs/performance
	if os.Getenv("VERCEL") == "1" {
		gin.SetMode(gin.ReleaseMode)
	}
	
	engine = gin.Default()

	// CORS configuration
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL, "https://store-psi-bice.vercel.app"}, // Added explicit production URL
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

	// Protected routes (require JWT)
	api := engine.Group("/api")
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
			stock.POST("/simple-purchase", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.SimplePurchaseStock)
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
}

// Handler is the entry point for Vercel
func Handler(w http.ResponseWriter, r *http.Request) {
	initApp()
	engine.ServeHTTP(w, r)
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
