package cmd

import (
	"github.com/1omercohen/blueprint-assignment/cli/internal/display"
	"github.com/spf13/cobra"
)

var (
	updateID   int
	updateFile string
)

var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update a blueprint by ID",
	Long:  "Partially update an existing blueprint by supplying a JSON file with the fields to change.",
	RunE:  runUpdate,
}

func init() {
	updateCmd.Flags().IntVarP(&updateID, "id", "i", 0, "Blueprint ID (required)")
	updateCmd.Flags().StringVarP(&updateFile, "file", "f", "", "Path to JSON file containing fields to update (required)")
	_ = updateCmd.MarkFlagRequired("id")
	_ = updateCmd.MarkFlagRequired("file")
	rootCmd.AddCommand(updateCmd)
}

func runUpdate(_ *cobra.Command, _ []string) error {
	payload, err := parseJSONPayload(updateFile)
	if err != nil {
		display.PrintError(err)
		return nil
	}

	body, err := newClient().UpdateBlueprint(updateID, payload)
	if err != nil {
		display.PrintError(err)
		return nil
	}

	return display.PrintJSON(body)
}
