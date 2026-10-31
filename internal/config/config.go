package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
}

func loadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			k := strings.TrimSpace(parts[0])
			v := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
	}
}

func Load() *Config {
	// Auto-load .env if present
	loadEnvFile(".env")
	loadEnvFile("../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default to server 10.10.1.106 tunnel / native port 54322
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
