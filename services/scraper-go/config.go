package main

import (
	"os"
	"github.com/joho/godotenv"
)

type FeedConfig struct {
	Name     string
	URL      string
	Category string
}

func GetTargetFeeds() []FeedConfig {
	_ = godotenv.Load("../../.env")

	rssUrl := os.Getenv("RSS_FEED_URL")
	if rssUrl == "" {
		rssUrl = "https://techcrunch.com/feed/"
	}

	return []FeedConfig{
		{Name: "TechCrunch", URL: rssUrl, Category: "Technology"},
		{Name: "BBC Tech", URL: "http://feeds.bbci.co.uk/news/technology/rss.xml", Category: "Technology"},
		{Name: "The Hindu Business", URL: "https://www.thehindu.com/business/feeder/default.rss", Category: "Business"},
		{Name: "Times of India Tech", URL: "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms", Category: "Technology"},
		{Name: "Ars Technica", URL: "https://feeds.arstechnica.com/arstechnica/index", Category: "Technology"},
		{Name: "Wired", URL: "https://www.wired.com/feed/rss", Category: "Technology"},
	}
}