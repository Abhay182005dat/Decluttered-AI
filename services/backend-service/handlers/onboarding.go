package handlers

import (
	"decluttered/backend/config"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type UpdateInterestsRequest struct {
	Interests []string `json:"interests" binding:"required,min=1"`
}

func HandleUpdateInterests(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session not found"})
		return
	}
	userID := userIDVal.(int)

	var req UpdateInterestsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please select at least one interest topic."})
		return
	}

	// Lowercase & clean all incoming interests
	cleanedInterests := make([]string, len(req.Interests))
	for i, item := range req.Interests {
		cleanedInterests[i] = strings.ToLower(strings.TrimSpace(item))
	}

	var user UserProfile
	var rawInterests pq.StringArray

	query := `
		UPDATE users
		SET interests = $1, onboarding_completed = TRUE, updated_at = NOW()
		WHERE id = $2
		RETURNING id, google_id, email, name, COALESCE(picture, ''), interests, onboarding_completed;
	`

	err := config.DB.QueryRow(query, pq.Array(cleanedInterests), userID).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &rawInterests, &user.OnboardingCompleted,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save interest preferences: " + err.Error()})
		return
	}

	user.Interests = []string(rawInterests)

	// Flush Redis caches correctly
	userCacheKey := fmt.Sprintf("news_feed_user_%d", userID)
	config.RDB.Del(config.Ctx, userCacheKey)
	config.RDB.Del(config.Ctx, "news_feed_public")

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Preferences updated successfully",
		"user":    user,
	})
}