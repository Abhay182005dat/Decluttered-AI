package config

import (
	"context"
	"database/sql"
	"log"

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

	// Connect to PostgreSQL
	connStr := "postgresql://postgres:Abhi%40sonda31@127.0.0.1:5432/decluttered_db?sslmode=disable"
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("PostgreSQL connection error: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("PostgreSQL ping failed: %v", err)
	}
	log.Println("Connected to PostgreSQL successfully.")

	// Connect to Redis
	RDB = redis.NewClient(&redis.Options{
		Addr: "127.0.0.1:6379",
	})

	_, err = RDB.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Redis connection failed: %v", err)
	}
	log.Println("Connected to Redis successfully.")
}