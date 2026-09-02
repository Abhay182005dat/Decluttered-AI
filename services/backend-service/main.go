package main

import (
	"log"
	"os"
	"decluttered/backend/config"
	"decluttered/backend/handlers"

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
		v1.GET("/feed", handlers.GetNewsFeed)
		v1.GET("/events/:id", handlers.GetEventByID)
		v1.GET("/market", handlers.GetMarketData)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not specified
	}
	log.Println("Starting Go Backend API Server on port " + port + "...")
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}