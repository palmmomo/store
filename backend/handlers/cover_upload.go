package handlers

import (
	"fmt"
	"io"
	"net/http"

	"store-backend/db"

	"github.com/gin-gonic/gin"
)

// Allowed MIME types for job cover images
var allowedCoverMIMETypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
	"image/gif":  "gif",
}

// maxCoverSize is the maximum allowed cover image size (5 MB)
const maxCoverSize = 5 << 20

// UploadJobCover handles POST /api/jobs/:id/cover
// Receives a multipart file field named 'cover', validates MIME type and size,
// uploads to the 'task-covers' bucket, and updates the job's cover_image_url.
func UploadJobCover(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ ID ของงาน"})
		return
	}

	// Verify the job exists
	var jobs []map[string]interface{}
	if err := db.Client.Query("jobs", fmt.Sprintf("select=id&id=eq.%s", jobID), &jobs); err != nil || len(jobs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบงานที่ระบุ"})
		return
	}

	// Parse the uploaded file
	fileHeader, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาเลือกไฟล์รูปภาพ (field: cover)"})
		return
	}

	// Validate file size
	if fileHeader.Size > maxCoverSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไฟล์มีขนาดเกิน 5MB"})
		return
	}

	// Open the file to read content type
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอ่านไฟล์ได้"})
		return
	}
	defer file.Close()

	// Read file bytes
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอ่านไฟล์ได้"})
		return
	}

	// Detect content type from file content (not just header)
	contentType := http.DetectContentType(fileBytes)

	// Validate MIME type
	ext, ok := allowedCoverMIMETypes[contentType]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF เท่านั้น"})
		return
	}

	// Upload to Supabase Storage: task-covers/jobs/{id}/cover.{ext}
	storagePath := fmt.Sprintf("jobs/%s/cover.%s", jobID, ext)
	if err := db.Client.UploadFile("task-covers", storagePath, fileBytes, contentType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("อัปโหลดรูปภาพไม่สำเร็จ: %v", err)})
		return
	}

	// Get public URL
	publicURL := db.Client.GetPublicURL("task-covers", storagePath)

	// Update the job record with the cover URL
	updateData := map[string]interface{}{
		"cover_image_url": publicURL,
	}
	var result []map[string]interface{}
	if err := db.Client.Update("jobs", fmt.Sprintf("id=eq.%s", jobID), updateData, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("อัปเดตข้อมูลงานไม่สำเร็จ: %v", err)})
		return
	}

	if len(result) > 0 {
		c.JSON(http.StatusOK, result[0])
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "อัปโหลดรูปปกสำเร็จ", "cover_image_url": publicURL})
	}
}

// DeleteJobCover handles DELETE /api/jobs/:id/cover
// Deletes the cover image from Storage and clears cover_image_url in the job record.
func DeleteJobCover(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ ID ของงาน"})
		return
	}

	// Fetch the job to get the current cover URL
	var jobs []map[string]interface{}
	if err := db.Client.Query("jobs", fmt.Sprintf("select=id,cover_image_url&id=eq.%s", jobID), &jobs); err != nil || len(jobs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบงานที่ระบุ"})
		return
	}

	// Try to delete all possible cover file extensions from storage
	// since we don't know which extension was used
	for _, ext := range allowedCoverMIMETypes {
		storagePath := fmt.Sprintf("jobs/%s/cover.%s", jobID, ext)
		// Ignore errors — file might not exist for all extensions
		_ = db.Client.DeleteFile("task-covers", storagePath)
	}

	// Clear cover_image_url in the job record
	updateData := map[string]interface{}{
		"cover_image_url": nil,
	}
	if err := db.Client.Update("jobs", fmt.Sprintf("id=eq.%s", jobID), updateData, nil); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("อัปเดตข้อมูลงานไม่สำเร็จ: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบรูปปกสำเร็จ"})
}
