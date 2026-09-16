package main

import (
	"log"
	"os"
	"decluttered/backend/config"
	"decluttered/backend/handlers"
	"decluttered/backend/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// CORS Middleware
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	if os.Getenv("DB_URI") == "" {
		_ = godotenv.Load("../../.env")
		_ = godotenv.Load(".env")
	}
	config.InitConnections()

	r := gin.Default()
	
	// Apply CORS
	r.Use(CORSMiddleware())

	v1 := r.Group("/api/v1")
	{
		// Public News & Market Routes
		v1.GET("/feed", handlers.GetNewsFeed)
		v1.GET("/events/:id", handlers.GetEventByID)
		v1.GET("/market", handlers.GetMarketData)

		// Public Authentication Routes
		v1.POST("/auth/google", handlers.HandleGoogleAuth)
		v1.POST("/auth/register", handlers.HandleRegister)
		v1.POST("/auth/login", handlers.HandleLogin)

		// Protected User Routes (Requires JWT Header: "Authorization: Bearer <token>")
		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/user/me", func(c *gin.Context) {
				userID, _ := c.Get("userID")
				c.JSON(200, gin.H{"status": "authenticated", "user_id": userID})
			})
			// onboarding Interests Endpoint
			protected.POST("/user/interests", handlers.HandleUpdateInterests)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Starting Go Backend API Server on port " + port + "...")
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}