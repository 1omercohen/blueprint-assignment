package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func encodeBody(body any) (io.Reader, error) {
	encoded, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to encode request body: %w", err)
	}
	return bytes.NewBuffer(encoded), nil
}

func (c *Client) buildRequest(method, reqURL string, body any) (*http.Request, error) {
	var bodyReader io.Reader

	if body != nil {
		var err error
		bodyReader, err = encodeBody(body)
		if err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequest(method, reqURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", contentTypeJSON)
	}

	return req, nil
}

func (c *Client) executeRequest(req *http.Request) ([]byte, error) {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= http.StatusBadRequest {
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(responseBody))
	}

	return responseBody, nil
}

func (c *Client) do(method, reqURL string, body any) ([]byte, error) {
	req, err := c.buildRequest(method, reqURL, body)
	if err != nil {
		return nil, err
	}
	return c.executeRequest(req)
}
