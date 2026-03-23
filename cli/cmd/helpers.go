package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/1omercohen/blueprint-assignment/cli/internal/client"
)

// newClient constructs a BlueprintClient using the global --api-url flag.
func newClient() client.BlueprintClient {
	return client.New(apiBaseURL)
}

// parseJSONPayload reads a JSON file from path and returns it as map[string]any.
func parseJSONPayload(path string) (map[string]any, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %q: %w", path, err)
	}

	var payload map[string]any
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, fmt.Errorf("invalid JSON in file %q: %w", path, err)
	}

	return payload, nil
}
