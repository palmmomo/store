package app

import (
	"log"
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

var Engine *gin.Engine

func InitApp() {
	if Engine != nil {
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
	if os.Getenv("VERCEL") == "1" {
		gin.SetMode(gin.ReleaseMode)
	}

	Engine = gin.Default()

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	
	// Strip trailing slash if present to avoid CORS header mismatch
	if len(frontendURL) > 0 && frontendURL[len(frontendURL)-1] == '/' {
		frontendURL = frontendURL[:len(frontendURL)-1]
	}

	Engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL, "https://store-psi-bice.vercel.app", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "apikey"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowWildcard:    true,
	}))

	public := Engine.Group("/api")
	{
		public.POST("/auth/login", handlers.Login)
		public.POST("/auth/refresh", handlers.RefreshToken)
		public.POST("/auth/setup", handlers.SetupFirstAdmin)
	}

	api := Engine.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		branches := api.Group("/branches")
		{
			branches.GET("", handlers.GetBranches)
			branches.POST("", middleware.RequireRole("superadmin"), handlers.CreateBranch)
			branches.PUT("/:id", middleware.RequireRole("superadmin"), handlers.UpdateBranch)
			branches.DELETE("/:id", middleware.RequireRole("superadmin"), handlers.DeleteBranch)
		}

		products := api.Group("/products")
		{
			products.GET("", handlers.GetProducts)
			products.GET("/:id", handlers.GetProduct)
			products.POST("", middleware.RequireRole("superadmin", "branch_admin"), handlers.CreateProduct)
			products.PUT("/:id", middleware.RequireRole("superadmin", "branch_admin"), handlers.UpdateProduct)
			products.DELETE("/:id", middleware.RequireRole("superadmin", "branch_admin"), handlers.DeleteProduct)
		}

		stock := api.Group("/stock")
		{
			stock.POST("/items", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.CreateStockItem)
			stock.GET("", stockHandler.GetStock)
			stock.GET("/items/:id", stockHandler.GetStockByID)
			stock.PUT("/items/:id", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.UpdateStockItem)
			stock.DELETE("/items/:id", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.DeleteStockItem)

			stock.POST("/purchase", middleware.RequireRole("superadmin", "branch_admin", "staff"), stockHandler.PurchaseStock)
			stock.POST("/deduct", stockHandler.DeductStock)
			stock.GET("/compare/:material_id", stockHandler.GetComparison)
		}

		orders := api.Group("/orders")
		{
			orders.GET("", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetOrders)
			orders.GET("/:id", handlers.GetOrder)
			orders.POST("", handlers.CreateOrder)
		}

		stats := api.Group("/stats")
		{
			stats.GET("/dashboard", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetDashboard)
			stats.GET("/chart", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetSalesChart)
			stats.GET("/summary", middleware.RequireRole("superadmin", "branch_admin"), handlers.GetSummary)
		}

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
