package database

import (
	"context"
	"fmt"
	"time"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("parse config postgres gagal: %w", err)
	}

	cfg.MaxConns = 30
	cfg.MinConns = 5
	cfg.MaxConnLifetime = 1 * time.Hour
	cfg.MaxConnIdleTime = 15 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("koneksi pool pgx gagal: %w", err)
	}

	// Ping verifikasi koneksi dengan timeout 3s
	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		// Log warning tapi jangan gagalkan startup jika db belum ready saat inisialisasi lokal
		return pool, fmt.Errorf("ping database warning: %w", err)
	}

	return pool, nil
}
