package config

import (
	"context"
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

var (
	DB  *sql.DB
	RDB *redis.Client
	Ctx = context.Background()
)

func InitConnections() {
	var err error

	// 1. PostgreSQL Setup (Dynamic DB_URI reading)
	connStr := os.Getenv("DB_URI")

	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("PostgreSQL connection error: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("PostgreSQL ping failed: %v", err)
	}
	log.Println("✓ Connected to PostgreSQL successfully.")

	// 2. Redis Setup (Supports both local redis:// and Upstash rediss:// TLS)
	redisURL := os.Getenv("REDIS_URL")
	var rdbOptions *redis.Options

	if redisURL != "" {
		// Parse rediss:// or redis:// URI strings
		opt, parseErr := redis.ParseURL(redisURL)
		if parseErr != nil {
			log.Fatalf("Failed to parse REDIS_URL: %v", parseErr)
		}
		rdbOptions = opt
	} else {
		// Fallback to local unauthenticated Redis
		rdbOptions = &redis.Options{
			Addr:     "127.0.0.1:6379",
			Password: "",
			DB:       0,
		}
	}

	RDB = redis.NewClient(rdbOptions)

	_, err = RDB.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Redis connection failed: %v", err)
	}
	log.Println("✓ Connected to Redis successfully.")
}