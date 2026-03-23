package cmd

import (
	"fmt"

	"github.com/1omercohen/blueprint-assignment/cli/internal/display"
	"github.com/spf13/cobra"
)

var deleteID int

var deleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a blueprint by ID",
	Long:  "Permanently delete a blueprint by its numeric ID.",
	RunE:  runDelete,
}

func init() {
	deleteCmd.Flags().IntVarP(&deleteID, "id", "i", 0, "Blueprint ID (required)")
	_ = deleteCmd.MarkFlagRequired("id")
	rootCmd.AddCommand(deleteCmd)
}

func runDelete(_ *cobra.Command, _ []string) error {
	if err := newClient().DeleteBlueprint(deleteID); err != nil {
		display.PrintError(err)
		return nil
	}

	display.PrintSuccess(fmt.Sprintf("Blueprint %d deleted successfully.", deleteID))
	return nil
}
