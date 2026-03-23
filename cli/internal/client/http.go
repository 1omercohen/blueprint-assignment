package client

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const (
	httpTimeout     = 10 * time.Second
	blueprintsPath  = "/blueprints"
	contentTypeJSON = "application/json"
)

// BlueprintClient defines the interface for interacting with the Blueprint Manager API.
type BlueprintClient interface {
	CreateBlueprint(payload map[string]any) ([]byte, error)
	GetBlueprint(id int) ([]byte, error)
	ListBlueprints(page, pageSize int, sortBy, sortOrder string) ([]byte, error)
	UpdateBlueprint(id int, payload map[string]any) ([]byte, error)
	DeleteBlueprint(id int) error
}

// Client is the HTTP implementation of BlueprintClient.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// New creates a new Client with the given base URL.
func New(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: httpTimeout,
		},
	}
}

func (c *Client) blueprintURL() string {
	return c.baseURL + blueprintsPath
}

func (c *Client) blueprintByIDURL(id int) string {
	return fmt.Sprintf("%s/%d", c.blueprintURL(), id)
}

// CreateBlueprint sends a POST request to create a blueprint.
func (c *Client) CreateBlueprint(payload map[string]any) ([]byte, error) {
	return c.do(http.MethodPost, c.blueprintURL(), payload)
}

// GetBlueprint sends a GET request to fetch a blueprint by ID.
func (c *Client) GetBlueprint(id int) ([]byte, error) {
	return c.do(http.MethodGet, c.blueprintByIDURL(id), nil)
}

// ListBlueprints sends a GET request with pagination and sorting query params.
func (c *Client) ListBlueprints(page, pageSize int, sortBy, sortOrder string) ([]byte, error) {
	params := url.Values{}
	params.Set("page", strconv.Itoa(page))
	params.Set("page_size", strconv.Itoa(pageSize))

	if sortBy != "" {
		params.Set("sort_by", sortBy)
	}

	if sortOrder != "" {
		params.Set("sort_order", sortOrder)
	}

	fullURL := fmt.Sprintf("%s?%s", c.blueprintURL(), params.Encode())
	return c.do(http.MethodGet, fullURL, nil)
}

// UpdateBlueprint sends a PUT request to update a blueprint by ID.
func (c *Client) UpdateBlueprint(id int, payload map[string]any) ([]byte, error) {
	return c.do(http.MethodPut, c.blueprintByIDURL(id), payload)
}

// DeleteBlueprint sends a DELETE request to remove a blueprint by ID.
func (c *Client) DeleteBlueprint(id int) error {
	_, err := c.do(http.MethodDelete, c.blueprintByIDURL(id), nil)
	return err
}
