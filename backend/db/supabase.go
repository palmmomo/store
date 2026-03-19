package db

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// SupabaseClient is a simple REST client for Supabase PostgREST
type SupabaseClient struct {
	BaseURL    string
	ServiceKey string
	HTTPClient *http.Client
}

var Client *SupabaseClient

// Init initializes the Supabase client
func Init() {
	Client = &SupabaseClient{
		BaseURL:    os.Getenv("SUPABASE_URL"),
		ServiceKey: os.Getenv("SUPABASE_SERVICE_KEY"),
		HTTPClient: &http.Client{},
	}
}

// buildRequest creates an authenticated request to Supabase PostgREST
func (s *SupabaseClient) buildRequest(method, table, query string, body interface{}) (*http.Request, error) {
	url := fmt.Sprintf("%s/rest/v1/%s", s.BaseURL, table)
	if query != "" {
		url = url + "?" + query
	}

	var reqBody io.Reader
	if body != nil {
		jsonBytes, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonBytes)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", s.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	return req, nil
}

// Query fetches data from a table
func (s *SupabaseClient) Query(table, queryParams string, result interface{}) error {
	req, err := s.buildRequest("GET", table, queryParams, nil)
	if err != nil {
		return err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return json.NewDecoder(resp.Body).Decode(result)
}

// Insert inserts a record into a table
func (s *SupabaseClient) Insert(table string, data interface{}, result interface{}) error {
	req, err := s.buildRequest("POST", table, "", data)
	if err != nil {
		return err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	if result != nil {
		return json.NewDecoder(resp.Body).Decode(result)
	}
	return nil
}

// Update updates records in a table
func (s *SupabaseClient) Update(table, queryParams string, data interface{}, result interface{}) error {
	req, err := s.buildRequest("PATCH", table, queryParams, data)
	if err != nil {
		return err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	if result != nil {
		return json.NewDecoder(resp.Body).Decode(result)
	}
	return nil
}

// Delete deletes records from a table
func (s *SupabaseClient) Delete(table, queryParams string) error {
	req, err := s.buildRequest("DELETE", table, queryParams, nil)
	if err != nil {
		return err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// RPC calls a Supabase RPC function
func (s *SupabaseClient) RPC(function string, params interface{}, result interface{}) error {
	url := fmt.Sprintf("%s/rest/v1/rpc/%s", s.BaseURL, function)

	jsonBytes, err := json.Marshal(params)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return err
	}

	req.Header.Set("apikey", s.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase rpc error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	if result != nil {
		return json.NewDecoder(resp.Body).Decode(result)
	}
	return nil
}
