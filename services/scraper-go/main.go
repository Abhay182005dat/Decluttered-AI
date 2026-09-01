package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/mmcdole/gofeed"
	"github.com/segmentio/kafka-go"
)

type ArticlePayload struct {
	SourceName  string    `json:"source_name"`
	SourceURL   string    `json:"source_url"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Category    string    `json:"category"`
	PublishedAt time.Time `json:"published_at"`
}

func ensureTopic(brokerAddr, topic string) {
	conn, err := kafka.Dial("tcp", brokerAddr)
	if err != nil {
		log.Fatalf("Failed to dial broker: %v", err)
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		log.Fatalf("Failed to get controller: %v", err)
	}

	controllerConn, err := kafka.Dial("tcp", net.JoinHostPort(controller.Host, strconv.Itoa(controller.Port)))
	if err != nil {
		log.Fatalf("Failed to connect to controller: %v", err)
	}
	defer controllerConn.Close()

	topicConfigs := []kafka.TopicConfig{
		{
			Topic:             topic,
			NumPartitions:     1,
			ReplicationFactor: 1,
		},
	}

	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		log.Printf("Topic creation note (may already exist): %v", err)
	} else {
		fmt.Printf("Ensured topic '%s' exists\n", topic)
	}
}

func main() {
	// Load environment variables from .env file
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	brokerAddr := os.Getenv("KAFKA_BROKER")
	if brokerAddr == "" {
		brokerAddr = "127.0.0.1:9092"
	}

	topicName := os.Getenv("KAFKA_TOPIC")
	if topicName == "" {
		topicName = "raw-articles"
	}

	rssFeedURL := os.Getenv("RSS_FEED_URL")
	if rssFeedURL == "" {
		rssFeedURL = "https://techcrunch.com/feed/"
	}

	// 1. Automatically create topic if missing
	ensureTopic(brokerAddr, topicName)

	// 2. Initialize Kafka Writer with AutoTopic creation flag
	kafkaWriter := &kafka.Writer{
		Addr:                   kafka.TCP(brokerAddr),
		Topic:                  topicName,
		Balancer:               &kafka.LeastBytes{},
		AllowAutoTopicCreation: true,
	}
	defer kafkaWriter.Close()

	// 3. Parse RSS Feed
	fp := gofeed.NewParser()
	feed, err := fp.ParseURL(rssFeedURL)
	if err != nil {
		log.Fatalf("Failed to fetch RSS feed: %v", err)
	}

	fmt.Printf("Fetched %d articles from %s\n", len(feed.Items), feed.Title)

	// 4. Publish items to Kafka
	for _, item := range feed.Items {
		content := item.Content
		if content == "" {
			content = item.Description
		}

		pubDate := time.Now()
		if item.PublishedParsed != nil {
			pubDate = *item.PublishedParsed
		}

		payload := ArticlePayload{
			SourceName:  "TechCrunch",
			SourceURL:   item.Link,
			Title:       item.Title,
			Content:     content,
			Category:    "Technology",
			PublishedAt: pubDate,
		}

		jsonBytes, err := json.Marshal(payload)
		if err != nil {
			log.Printf("Error marshaling payload: %v", err)
			continue
		}

		err = kafkaWriter.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(item.Link),
			Value: jsonBytes,
		})

		if err != nil {
			log.Printf("Failed to publish message: %v", err)
		} else {
			fmt.Printf("Published to Kafka: %s\n", item.Title)
		}
	}
}
