package cmd

import (
	"fmt"

	"github.com/1omercohen/blueprint-assignment/cli/internal/display"
	"github.com/spf13/cobra"
)

const (
	defaultPage    = 1
	defaultPageSize = 20
	minPage        = 1
	minPageSize    = 1
	maxPageSize    = 100
)

var validSortFields = map[string]bool{
	"name":       true,
	"version":    true,
	"created_at": true,
}

var validSortOrders = map[string]bool{
	"ASC":  true,
	"DESC": true,
}

var (
	listPage      int
	listPageSize  int
	listSortBy    string
	listSortOrder string
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List blueprints",
	Long:  "List blueprints with optional pagination and sorting.",
	RunE:  runList,
}

func init() {
	listCmd.Flags().IntVar(&listPage, "page", defaultPage, "Page number (1-based)")
	listCmd.Flags().IntVar(&listPageSize, "page-size", defaultPageSize, "Number of results per page (1–100)")
	listCmd.Flags().StringVar(&listSortBy, "sort-by", "", "Field to sort by: name, version, created_at")
	listCmd.Flags().StringVar(&listSortOrder, "sort-order", "", "Sort direction: ASC or DESC")
	rootCmd.AddCommand(listCmd)
}

func validateListFlags() error {
	if listPage < minPage {
		return fmt.Errorf("--page must be >= %d", minPage)
	}
	if listPageSize < minPageSize || listPageSize > maxPageSize {
		return fmt.Errorf("--page-size must be between %d and %d", minPageSize, maxPageSize)
	}
	if listSortBy != "" && !validSortFields[listSortBy] {
		return fmt.Errorf("--sort-by must be one of: name, version, created_at")
	}
	if listSortOrder != "" && !validSortOrders[listSortOrder] {
		return fmt.Errorf("--sort-order must be one of: ASC, DESC")
	}
	return nil
}

func runList(_ *cobra.Command, _ []string) error {
	if err := validateListFlags(); err != nil {
		display.PrintError(err)
		return nil
	}

	body, err := newClient().ListBlueprints(listPage, listPageSize, listSortBy, listSortOrder)
	if err != nil {
		display.PrintError(err)
		return nil
	}

	return display.PrintJSON(body)
}
