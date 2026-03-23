package display

import (
	"encoding/json"
	"fmt"
	"os"
)

const jsonIndent = "  "

// PrintJSON pretty-prints raw JSON bytes to stdout.
func PrintJSON(data []byte) error {
	var parsed any
	if err := json.Unmarshal(data, &parsed); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	formatted, err := json.MarshalIndent(parsed, "", jsonIndent)
	if err != nil {
		return fmt.Errorf("failed to format response: %w", err)
	}

	fmt.Println(string(formatted))
	return nil
}

// PrintSuccess prints a success message to stdout.
func PrintSuccess(message string) {
	fmt.Println(message)
}

// PrintError prints an error message to stderr and exits with code 1.
func PrintError(err error) {
	fmt.Fprintln(os.Stderr, "Error:", err.Error())
	os.Exit(1)
}
