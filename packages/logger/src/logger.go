package logger

import (
	"context"
	"log/slog"
	"os"
)

type contextKey string

const (
	TraceIDKey contextKey = "trace_id"
)

var defaultLogger *slog.Logger

func init() {
	// Default to JSON for production-ready logs
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}

	// If in development mode, we could use TextHandler,
	// but JSON is safer for the monorepo standard.
	handler := slog.NewJSONHandler(os.Stdout, opts)
	defaultLogger = slog.New(handler)
	slog.SetDefault(defaultLogger)
}

// Ctx returns a logger that includes the trace_id from the context if present.
func Ctx(ctx context.Context) *slog.Logger {
	if ctx == nil {
		return defaultLogger
	}

	if traceID, ok := ctx.Value(TraceIDKey).(string); ok {
		return defaultLogger.With(slog.String("trace_id", traceID))
	}

	return defaultLogger
}

// WithCorrelation adds a trace ID to the context
func WithCorrelation(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, TraceIDKey, traceID)
}

// Public helpers for quick logging
func Info(ctx context.Context, msg string, args ...any) {
	Ctx(ctx).Info(msg, args...)
}

func Error(ctx context.Context, msg string, args ...any) {
	Ctx(ctx).Error(msg, args...)
}

func Warn(ctx context.Context, msg string, args ...any) {
	Ctx(ctx).Warn(msg, args...)
}

func Debug(ctx context.Context, msg string, args ...any) {
	Ctx(ctx).Debug(msg, args...)
}
