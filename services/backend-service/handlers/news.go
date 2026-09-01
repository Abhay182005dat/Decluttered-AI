package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"decluttered/backend/config"

	"github.com/gin-gonic/gin"
)

type Summary struct {
	WhatHappened  string `json:"what_happened"`
	WhyItHappened string `json:"why_it_happened"`
	LatestUpdates string `json:"latest_updates"`
	WhyItMatters  string `json:"why_it_matters"`
}

type EventCluster struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Category     string   `json:"category"`
	ArticleCount int      `json:"article_count"`
	CreatedAt    string   `json:"created_at"`
	Summary      *Summary `json:"summary,omitempty"`
}

// GET /api/v1/feed
func GetNewsFeed(c *gin.Context) {
	cacheKey := "news_feed_latest"

	// 1. Check Redis Cache
	cachedData, err := config.RDB.Get(config.Ctx, cacheKey).Result()
	if err == nil {
		var cachedFeed []EventCluster
		if json.Unmarshal([]byte(cachedData), &cachedFeed) == nil {
			c.Header("X-Cache", "HIT")
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": cachedFeed})
			return
		}
	}

	// 2. Fetch from PostgreSQL
	query := `
		SELECT ec.id, ec.title, ec.category, ec.article_count, ec.created_at,
		       s.what_happened, s.why_it_happened, s.latest_updates, s.why_it_matters
		FROM event_clusters ec
		LEFT JOIN summaries s ON ec.id = s.cluster_id
		ORDER BY ec.created_at DESC
		LIMIT 20;
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var feed []EventCluster
	for rows.Next() {
		var ec EventCluster
		var s Summary
		var what, why, updates, matters *string

		err := rows.Scan(
			&ec.ID, &ec.Title, &ec.Category, &ec.ArticleCount, &ec.CreatedAt,
			&what, &why, &updates, &matters,
		)
		if err != nil {
			continue
		}

		if what != nil {
			s.WhatHappened = *what
			s.WhyItHappened = *why
			s.LatestUpdates = *updates
			s.WhyItMatters = *matters
			ec.Summary = &s
		}

		feed = append(feed, ec)
	}

	// 3. Cache result in Redis for 60 seconds
	if jsonBytes, err := json.Marshal(feed); err == nil {
		config.RDB.Set(config.Ctx, cacheKey, jsonBytes, 60*time.Second)
	}

	c.Header("X-Cache", "MISS")
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": feed})
}

type Article struct {
	ID          string `json:"id"`
	SourceName  string `json:"source_name"`
	SourceURL   string `json:"source_url"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	PublishedAt string `json:"published_at"`
}

type EventDetailResponse struct {
	Cluster  EventCluster `json:"cluster"`
	Articles []Article    `json:"articles"`
}

// GET /api/v1/events/:id
func GetEventByID(c *gin.Context) {
	eventID := c.Param("id")
	cacheKey := "event_detail_" + eventID

	// 1. Check Redis Cache
	cachedData, err := config.RDB.Get(config.Ctx, cacheKey).Result()
	if err == nil {
		var detail EventDetailResponse
		if json.Unmarshal([]byte(cachedData), &detail) == nil {
			c.Header("X-Cache", "HIT")
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": detail})
			return
		}
	}

	// 2. Fetch Event & Summary from PostgreSQL
	clusterQuery := `
		SELECT ec.id, ec.title, ec.category, ec.article_count, ec.created_at,
		       s.what_happened, s.why_it_happened, s.latest_updates, s.why_it_matters
		FROM event_clusters ec
		LEFT JOIN summaries s ON ec.id = s.cluster_id
		WHERE ec.id = $1;
	`

	var ec EventCluster
	var s Summary
	var what, why, updates, matters *string

	err = config.DB.QueryRow(clusterQuery, eventID).Scan(
		&ec.ID, &ec.Title, &ec.Category, &ec.ArticleCount, &ec.CreatedAt,
		&what, &why, &updates, &matters,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event cluster not found"})
		return
	}

	if what != nil {
		s.WhatHappened = *what
		s.WhyItHappened = *why
		s.LatestUpdates = *updates
		s.WhyItMatters = *matters
		ec.Summary = &s
	}

	// 3. Fetch Linked Articles
	articlesQuery := `
		SELECT id, source_name, source_url, title, content, published_at
		FROM articles
		WHERE cluster_id = $1
		ORDER BY published_at DESC;
	`

	rows, err := config.DB.Query(articlesQuery, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var articles []Article
	for rows.Next() {
		var a Article
		if err := rows.Scan(&a.ID, &a.SourceName, &a.SourceURL, &a.Title, &a.Content, &a.PublishedAt); err == nil {
			articles = append(articles, a)
		}
	}

	response := EventDetailResponse{
		Cluster:  ec,
		Articles: articles,
	}

	// 4. Cache in Redis for 5 minutes
	if jsonBytes, err := json.Marshal(response); err == nil {
		config.RDB.Set(config.Ctx, cacheKey, jsonBytes, 5*time.Minute)
	}

	c.Header("X-Cache", "MISS")
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": response})
}