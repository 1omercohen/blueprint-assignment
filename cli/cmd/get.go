package cmd

import (
	"github.com/1omercohen/blueprint-assignment/cli/internal/display"
	"github.com/spf13/cobra"
)

var getID int

var getCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a blueprint by ID",
	Long:  "Fetch and display a single blueprint by its numeric ID.",
	RunE:  runGet,
}

func init() {
	getCmd.Flags().IntVarP(&getID, "id", "i", 0, "Blueprint ID (required)")
	_ = getCmd.MarkFlagRequired("id")
	rootCmd.AddCommand(getCmd)
}

func runGet(_ *cobra.Command, _ []string) error {
	body, err := newClient().GetBlueprint(getID)
	if err != nil {
		display.PrintError(err)
		return nil
	}

	return display.PrintJSON(body)
}
