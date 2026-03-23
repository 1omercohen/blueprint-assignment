package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

const defaultAPIBaseURL = "http://localhost:3000"

var apiBaseURL string

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
}
