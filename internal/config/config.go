package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// PostgreSQL 17.11 native port on server 10.10.1.106 is 54322
		dbURL = "postgres://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-jwt-token-with-at-least-32-bytes-long"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		JWTSecret:   jwtSecret,
	}
}
