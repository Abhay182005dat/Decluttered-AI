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
			// Technology
			{Name: "TechCrunch", URL: rssUrl, Category: "technology"},
			{Name: "The Verge", URL: "https://www.theverge.com/rss/index.xml", Category: "technology"},
			{Name: "Ars Technica", URL: "https://feeds.arstechnica.com/arstechnica/index", Category: "technology"},

			// Artificial Intelligence
			{Name: "Google News AI", URL: "https://news.google.com/rss/search?q=artificial+intelligence", Category: "ai"},
			{Name: "MIT Tech Review AI", URL: "https://www.technologyreview.com/topic/artificial-intelligence/feed/", Category: "ai"},

			// Markets & Finance
			{Name: "MarketWatch Top Stories", URL: "https://feeds.content.dowjones.io/public/rss/mw_topstories", Category: "markets"},
			{Name: "The Hindu Business", URL: "https://www.thehindu.com/business/feeder/default.rss", Category: "markets"},

			// Global Politics
			{Name: "BBC World News", URL: "http://feeds.bbci.co.uk/news/world/rss.xml", Category: "politics"},

			// Science & Space
			{Name: "Phys.org Science", URL: "https://phys.org/rss-feed/science-news/", Category: "science"},
			{Name: "NASA News", URL: "https://www.nasa.gov/rss/dyn/breaking_news.rss", Category: "science"},

			// Web3 & Crypto
			{Name: "CoinDesk", URL: "https://coindesk.com/arc/outboundfeeds/rss/", Category: "crypto"},

			// Climate & Energy
			{Name: "Grist Climate", URL: "https://grist.org/feed/", Category: "climate"},
			{Name: "Canary Media", URL: "https://www.canarymedia.com/feed", Category: "climate"},
			{Name: "Google News Climate", URL: "https://news.google.com/rss/search?q=climate+change+energy", Category: "climate"},
	}
}