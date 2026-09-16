package handlers

import (
	"database/sql"
	"decluttered/backend/config"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
)

// Request payloads
type GoogleAuthRequest struct {
	Credential string `json:"credential" binding:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// User Profile response representation
type UserProfile struct {
	ID                  int      `json:"id"`
	GoogleID            *string  `json:"google_id,omitempty"`
	Email               string   `json:"email"`
	Name                string   `json:"name"`
	Picture             string   `json:"picture"`
	Interests           []string `json:"interests"`
	OnboardingCompleted bool     `json:"onboarding_completed"`
}

type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// Helper: Generate signed JWT
func generateToken(userID int, email string) (string, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("super-secret-key-change-me")
	}

	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// 1. Google OAuth Authentication
func HandleGoogleAuth(c *gin.Context) {
	var req GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	payload, err := idtoken.Validate(c.Request.Context(), req.Credential, googleClientID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token: " + err.Error()})
		return
	}

	googleID := payload.Subject
	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)
	picture, _ := payload.Claims["picture"].(string)

	var user UserProfile
	var rawInterests pq.StringArray

	query := `
		INSERT INTO users (google_id, email, name, picture, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (email) 
		DO UPDATE SET google_id = EXCLUDED.google_id, name = EXCLUDED.name, picture = EXCLUDED.picture, updated_at = NOW()
		RETURNING id, google_id, email, name, COALESCE(picture, ''), interests, onboarding_completed;
	`

	err = config.DB.QueryRow(query, googleID, email, name, picture).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &rawInterests, &user.OnboardingCompleted,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}
	user.Interests = []string(rawInterests)

	tokenString, err := generateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"token":  tokenString,
		"user":   user,
	})
}

// 2. Native Email/Password Registration
func HandleRegister(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters & email valid."})
		return
	}

	var exists bool
	_ = config.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", req.Email).Scan(&exists)
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "An account with this email already exists."})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
		return
	}

	var user UserProfile
	var rawInterests pq.StringArray

	query := `
		INSERT INTO users (name, email, password_hash, updated_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, google_id, email, name, COALESCE(picture, ''), interests, onboarding_completed;
	`
	err = config.DB.QueryRow(query, req.Name, req.Email, string(hashedPassword)).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &rawInterests, &user.OnboardingCompleted,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}
	user.Interests = []string(rawInterests)

	tokenString, err := generateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"token":  tokenString,
		"user":   user,
	})
}

// 3. Native Email/Password Login
func HandleLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid login credentials format"})
		return
	}

	var user UserProfile
	var passwordHash sql.NullString
	var rawInterests pq.StringArray

	query := `SELECT id, google_id, email, name, COALESCE(picture, ''), password_hash, interests, onboarding_completed FROM users WHERE email=$1`
	err := config.DB.QueryRow(query, req.Email).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &passwordHash, &rawInterests, &user.OnboardingCompleted,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !passwordHash.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This account uses Google Sign-In. Please sign in with Google."})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash.String), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	user.Interests = []string(rawInterests)
	tokenString, err := generateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"token":  tokenString,
		"user":   user,
	})
}