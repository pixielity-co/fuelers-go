package logger

import (
	"fmt"
)

// Info returns the package description
func Info() string {
	return fmt.Sprintf("Fuelers Monorepo Package: %s", "logger")
}
