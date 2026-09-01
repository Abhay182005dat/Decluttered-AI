package main

import (
	"encoding/json"
	"log"
	"os"
	"sync"
	"time"

	"github.com/IBM/sarama"
	"github.com/joho/godotenv"
	"github.com/mmcdole/gofeed"
)

type ArticlePayload struct {
	SourceName  string    `json:"source_name"`
	SourceURL   string    `json:"source_url"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Category    string    `json:"category"`
	PublishedAt time.Time `json:"published_at"`
}

func main() {
	_ = godotenv.Load("../../.env")

	kafkaBroker := os.Getenv("KAFKA_BROKER")
	if kafkaBroker == "" {
		kafkaBroker = "127.0.0.1:9092"
	}

	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	if kafkaTopic == "" {
		kafkaTopic = "raw-articles"
	}

	targetFeeds := GetTargetFeeds()

	config := sarama.NewConfig()
	config.Producer.Return.Successes = true

	producer, err := sarama.NewSyncProducer([]string{kafkaBroker}, config)
	if err != nil {
		log.Fatalf("Failed to start Kafka producer: %v", err)
	}
	defer producer.Close()

	log.Printf("🚀 Multi-Source Scraper Active. Ingesting %d feeds via Kafka [%s]...\n", len(targetFeeds), kafkaTopic)

	var wg sync.WaitGroup
	articleChan := make(chan ArticlePayload, 100)

	go func() {
		for article := range articleChan {
			bytes, err := json.Marshal(article)
			if err != nil {
				continue
			}

			msg := &sarama.ProducerMessage{
				Topic: kafkaTopic,
				Value: sarama.ByteEncoder(bytes),
			}

			_, _, err = producer.SendMessage(msg)
			if err != nil {
				log.Printf("⚠️ Failed to publish article [%s]: %v", article.Title, err)
			} else {
				log.Printf("✓ [KAFKA PUB] [%s] %s", article.SourceName, article.Title)
			}
		}
	}()

	fp := gofeed.NewParser()

	for _, feed := range targetFeeds {
		wg.Add(1)
		go func(f FeedConfig) {
			defer wg.Done()
			log.Printf("Fetching stream: %s (%s)", f.Name, f.URL)

			parsedFeed, err := fp.ParseURL(f.URL)
			if err != nil {
				log.Printf("❌ Failed to scrape [%s]: %v", f.Name, err)
				return
			}

			for _, item := range parsedFeed.Items {
				content := item.Description
				if item.Content != "" {
					content = item.Content
				}

				pubDate := time.Now()
				if item.PublishedParsed != nil {
					pubDate = *item.PublishedParsed
				}

				payload := ArticlePayload{
					SourceName:  f.Name,
					SourceURL:   item.Link,
					Title:       item.Title,
					Content:     content,
					Category:    f.Category,
					PublishedAt: pubDate,
				}

				articleChan <- payload
			}
		}(feed)
	}

	wg.Wait()
	close(articleChan)

	log.Println("\n Ingestion complete. All feeds streamed to Kafka.")
}