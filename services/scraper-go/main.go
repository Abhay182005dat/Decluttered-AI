package main

import (
	"crypto/tls"
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
const (
	MaxItemsPerFeed = 4
	PublisherWorkers = 10
)

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

	kafkaUser := os.Getenv("KAFKA_USER")
	kafkaPassword := os.Getenv("KAFKA_PASSWORD")

	targetFeeds := GetTargetFeeds()

	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.Return.Errors = true
	// performance tuning : Enable batching for network efficiency
	config.Producer.Flush.Frequency = 100 * time.Millisecond
	config.Producer.Flush.MaxMessages = 50

	// Dynamically attach TLS & SASL/PLAIN if cloud credentials are present (Aiven)
	if kafkaUser != "" && kafkaPassword != "" {
		config.Net.SASL.Enable = true
		config.Net.SASL.User = kafkaUser
		config.Net.SASL.Password = kafkaPassword
		config.Net.SASL.Mechanism = sarama.SASLTypePlaintext

		config.Net.TLS.Enable = true
		config.Net.TLS.Config = &tls.Config{
			InsecureSkipVerify: true,
		}
	}

	producer, err := sarama.NewSyncProducer([]string{kafkaBroker}, config)
	if err != nil {
		log.Fatalf("Failed to start Kafka producer: %v", err)
	}
	defer producer.Close()

	log.Printf("Parallel Scraper Active. processing %d feeds with %d workers via Kafka [%s]...\n", len(targetFeeds), PublisherWorkers, kafkaTopic)

	articleChan := make(chan ArticlePayload, 100)
	var wg sync.WaitGroup
	
	for w := 1; w <= PublisherWorkers; w++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for article := range articleChan {
				bytes, err := json.Marshal(article)
				if err != nil {
					continue
				}

				msg := &sarama.ProducerMessage{
					Topic: kafkaTopic,
					Key: sarama.StringEncoder(article.Category),
					Value: sarama.ByteEncoder(bytes),
				}

				_, _, err = producer.SendMessage(msg)
				if err != nil {
					log.Printf("⚠️ Worker %d Failed to publish article [%s]: %v", workerID, article.Title, err)
				} else {
					log.Printf("✓ [WORKER %d KAFKA PUB] [%s | %s] %s", workerID, article.Category, article.SourceName, article.Title)
				}
			}
		}(w)
	}

	var scraperWg sync.WaitGroup
	fp := gofeed.NewParser()

	for _, feed := range targetFeeds {
		scraperWg.Add(1)
		go func(f FeedConfig) {
			defer scraperWg.Done()
			log.Printf("Fetching stream: %s (%s)", f.Name, f.URL)

			parsedFeed, err := fp.ParseURL(f.URL)
			if err != nil {
				log.Printf("❌ Failed to scrape [%s]: %v", f.Name, err)
				return
			}

			for i, item := range parsedFeed.Items {
				if i >= MaxItemsPerFeed {
					break
				}
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

	scraperWg.Wait()
	close(articleChan)
	wg.Wait()
	log.Println("\n Ingestion complete. All feeds streamed to Kafka.")
}