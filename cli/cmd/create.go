package cmd

import (
	"github.com/1omercohen/blueprint-assignment/cli/internal/display"
	"github.com/spf13/cobra"
)

var createFile string

var createCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new blueprint",
	Long:  "Create a new blueprint by supplying a JSON file with the blueprint fields.",
	RunE:  runCreate,
}

func init() {
	createCmd.Flags().StringVarP(&createFile, "file", "f", "", "Path to JSON file containing blueprint fields (required)")
	_ = createCmd.MarkFlagRequired("file")
	rootCmd.AddCommand(createCmd)
}

func runCreate(cmd *cobra.Command, _ []string) error {
	payload, err := parseJSONPayload(createFile)
	if err != nil {
		display.PrintError(err)
		return nil
	}

	body, err := newClient().CreateBlueprint(payload)
	if err != nil {
		display.PrintError(err)
		return nil
	}

	return display.PrintJSON(body)
}
