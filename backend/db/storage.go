package db

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// UploadFile uploads a file to Supabase Storage.
// bucket: the storage bucket name (e.g. "task-covers", "bill-attachments")
// path: the object path within the bucket (e.g. "jobs/123/cover.jpg")
// fileBytes: raw file content
// contentType: MIME type (e.g. "image/jpeg")
// Uses x-upsert header to overwrite existing files.
func (s *SupabaseClient) UploadFile(bucket, path string, fileBytes []byte, contentType string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.BaseURL, bucket, path)

	req, err := http.NewRequest("POST", url, bytes.NewReader(fileBytes))
	if err != nil {
		return fmt.Errorf("storage upload: failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("apikey", s.ServiceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("storage upload: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("storage upload error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// DeleteFile removes a file from Supabase Storage.
// bucket: the storage bucket name
// path: the object path to delete
func (s *SupabaseClient) DeleteFile(bucket, path string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s", s.BaseURL, bucket)

	body := map[string]interface{}{
		"prefixes": []string{path},
	}
	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("storage delete: failed to marshal body: %w", err)
	}

	req, err := http.NewRequest("DELETE", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return fmt.Errorf("storage delete: failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("apikey", s.ServiceKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("storage delete: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("storage delete error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// GetPublicURL returns the public URL for a file in a public bucket.
// bucket: the storage bucket name
// path: the object path
func (s *SupabaseClient) GetPublicURL(bucket, path string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.BaseURL, bucket, path)
}

// GetSignedURL generates a temporary signed URL for a file in a private bucket.
// bucket: the storage bucket name
// path: the object path
// expiresIn: URL validity in seconds (e.g. 3600 for 1 hour)
func (s *SupabaseClient) GetSignedURL(bucket, path string, expiresIn int) (string, error) {
	url := fmt.Sprintf("%s/storage/v1/object/sign/%s/%s", s.BaseURL, bucket, path)

	body := map[string]interface{}{
		"expiresIn": expiresIn,
	}
	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("storage sign: failed to marshal body: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", fmt.Errorf("storage sign: failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("apikey", s.ServiceKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage sign: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage sign error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("storage sign: failed to decode response: %w", err)
	}

	signedURL, ok := result["signedURL"].(string)
	if !ok {
		return "", fmt.Errorf("storage sign: signedURL not found in response")
	}

	// signedURL from Supabase is a relative path — prepend the base URL
	return s.BaseURL + "/storage/v1" + signedURL, nil
}
