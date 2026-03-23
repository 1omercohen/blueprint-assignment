package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

const (
	defaultAPIBaseURL = "http://localhost:3000"
	defaultTimeout    = 30 * time.Second
)

var (
	apiBaseURL string
	apiTimeout time.Duration
)

var rootCmd = &cobra.Command{
	Use:   "blueprint",
	Short: "Blueprint Manager CLI",
	Long:  "A CLI tool for managing Bluebricks Blueprints via the Blueprint Manager API.",
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVar(
		&apiBaseURL,
		"api-url",
		defaultAPIBaseURL,
		"Base URL of the Blueprint Manager API",
	)
	rootCmd.PersistentFlags().DurationVar(
		&apiTimeout,
		"timeout",
		defaultTimeout,
		"HTTP request timeout (e.g. 10s, 1m)",
	)
}
