package handlers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"store-backend/db"
	"store-backend/middleware"

	"github.com/gin-gonic/gin"
)

// Allowed MIME types for bill attachments (images + PDF)
var allowedBillMIMETypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/webp":      true,
	"application/pdf": true,
}

// maxBillAttachmentSize is the maximum allowed attachment size (10 MB)
const maxBillAttachmentSize = 10 << 20

// billAttachmentBucket is the Supabase Storage bucket for bill attachments
const billAttachmentBucket = "bill-attachments"

// GetBills handles GET /api/bills
// Query params: ?month=YYYY-MM&category=xxx
// Returns all bills ordered by bill_date desc, created_at desc.
func GetBills(c *gin.Context) {
	query := "select=*&order=bill_date.desc,created_at.desc"

	// Optional month filter (YYYY-MM format)
	if month := c.Query("month"); month != "" {
		// Validate format
		if len(month) == 7 && month[4] == '-' {
			// Filter: bill_date >= YYYY-MM-01 AND bill_date < next month
			startDate := month + "-01"
			// Parse to compute end date
			t, err := time.Parse("2006-01-02", startDate)
			if err == nil {
				endDate := t.AddDate(0, 1, 0).Format("2006-01-02")
				query += fmt.Sprintf("&bill_date=gte.%s&bill_date=lt.%s", startDate, endDate)
			}
		}
	}

	// Optional category filter
	if category := c.Query("category"); category != "" {
		query += fmt.Sprintf("&category=eq.%s", category)
	}

	var bills []map[string]interface{}
	if err := db.Client.Query("bills", query, &bills); err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	c.JSON(http.StatusOK, bills)
}

// GetBillSummary handles GET /api/bills/summary
// Returns monthly totals grouped by category.
// Query param: ?year=YYYY (optional, defaults to current year)
func GetBillSummary(c *gin.Context) {
	year := c.Query("year")
	if year == "" {
		year = strconv.Itoa(time.Now().Year())
	}

	// Validate year
	yearInt, err := strconv.Atoi(year)
	if err != nil || yearInt < 2000 || yearInt > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ปีไม่ถูกต้อง"})
		return
	}

	// Query all bills for the specified year
	startDate := fmt.Sprintf("%s-01-01", year)
	endDate := fmt.Sprintf("%d-01-01", yearInt+1)
	query := fmt.Sprintf("select=amount,category,bill_date&bill_date=gte.%s&bill_date=lt.%s", startDate, endDate)

	var bills []map[string]interface{}
	if err := db.Client.Query("bills", query, &bills); err != nil {
		c.JSON(http.StatusOK, gin.H{"year": year, "monthly": []interface{}{}, "by_category": map[string]interface{}{}})
		return
	}

	// Aggregate: monthly totals and per-category totals
	monthlyTotals := make(map[string]float64)    // "YYYY-MM" → total
	categoryTotals := make(map[string]float64)    // category → total
	monthlyCat := make(map[string]map[string]float64) // "YYYY-MM" → category → total

	for _, bill := range bills {
		amount, _ := bill["amount"].(float64)
		category, _ := bill["category"].(string)
		billDate, _ := bill["bill_date"].(string)

		if category == "" {
			category = "อื่นๆ"
		}

		// Extract YYYY-MM from bill_date
		monthKey := ""
		if len(billDate) >= 7 {
			monthKey = billDate[:7]
		}

		if monthKey != "" {
			monthlyTotals[monthKey] += amount
			if monthlyCat[monthKey] == nil {
				monthlyCat[monthKey] = make(map[string]float64)
			}
			monthlyCat[monthKey][category] += amount
		}
		categoryTotals[category] += amount
	}

	// Build monthly breakdown array
	var monthly []map[string]interface{}
	for m, total := range monthlyTotals {
		entry := map[string]interface{}{
			"month":       m,
			"total":       total,
			"by_category": monthlyCat[m],
		}
		monthly = append(monthly, entry)
	}

	// Compute grand total
	grandTotal := 0.0
	for _, t := range categoryTotals {
		grandTotal += t
	}

	c.JSON(http.StatusOK, gin.H{
		"year":        year,
		"grand_total": grandTotal,
		"monthly":     monthly,
		"by_category": categoryTotals,
	})
}

// CreateBill handles POST /api/bills
// Accepts multipart form data:
//   - description (required), amount (required), bill_date (required)
//   - category (optional, default "อื่นๆ"), note (optional)
//   - attachment (optional file — image or PDF)
func CreateBill(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse form fields
	description := strings.TrimSpace(c.PostForm("description"))
	amountStr := strings.TrimSpace(c.PostForm("amount"))
	billDate := strings.TrimSpace(c.PostForm("bill_date"))
	category := strings.TrimSpace(c.PostForm("category"))
	note := strings.TrimSpace(c.PostForm("note"))

	// Validate required fields
	if description == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกรายละเอียด"})
		return
	}
	if amountStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกจำนวนเงิน"})
		return
	}
	if billDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุวันที่"})
		return
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "จำนวนเงินไม่ถูกต้อง"})
		return
	}

	// Validate date format
	if _, err := time.Parse("2006-01-02", billDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"})
		return
	}

	if category == "" {
		category = "อื่นๆ"
	}

	// Step 1: Insert bill without attachment
	billData := map[string]interface{}{
		"description": description,
		"amount":      amount,
		"bill_date":   billDate,
		"category":    category,
		"note":        note,
		"user_id":     userID,
	}

	var inserted []map[string]interface{}
	if err := db.Client.Insert("bills", billData, &inserted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("บันทึกบิลไม่สำเร็จ: %v", err)})
		return
	}

	if len(inserted) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกบิลไม่สำเร็จ"})
		return
	}

	bill := inserted[0]
	billID := ""
	if v, ok := bill["id"].(float64); ok {
		billID = strconv.Itoa(int(v))
	} else if v, ok := bill["id"].(string); ok {
		billID = v
	}

	// Step 2: If attachment file exists, upload it
	fileHeader, err := c.FormFile("attachment")
	if err == nil && fileHeader != nil {
		attachmentURL, uploadErr := uploadBillAttachment(userID, billID, fileHeader)
		if uploadErr != nil {
			// Bill created but attachment failed — return bill with warning
			bill["_attachment_warning"] = uploadErr.Error()
			c.JSON(http.StatusCreated, bill)
			return
		}

		// Step 3: Update bill with attachment_url
		updateData := map[string]interface{}{
			"attachment_url": attachmentURL,
		}
		var updated []map[string]interface{}
		if err := db.Client.Update("bills", fmt.Sprintf("id=eq.%s", billID), updateData, &updated); err == nil && len(updated) > 0 {
			bill = updated[0]
		} else {
			bill["attachment_url"] = attachmentURL
		}
	}

	c.JSON(http.StatusCreated, bill)
}

// UpdateBill handles PUT /api/bills/:id
// Updates bill fields (JSON body, not attachment).
func UpdateBill(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ ID ของบิล"})
		return
	}

	var req struct {
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		BillDate    string  `json:"bill_date"`
		Category    string  `json:"category"`
		Note        string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("ข้อมูลไม่ถูกต้อง: %v", err)})
		return
	}

	updateData := map[string]interface{}{
		"description": req.Description,
		"amount":      req.Amount,
		"bill_date":   req.BillDate,
		"category":    req.Category,
		"note":        req.Note,
		"updated_at":  time.Now(),
	}

	var result []map[string]interface{}
	if err := db.Client.Update("bills", fmt.Sprintf("id=eq.%s", billID), updateData, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("อัปเดตบิลไม่สำเร็จ: %v", err)})
		return
	}

	if len(result) > 0 {
		c.JSON(http.StatusOK, result[0])
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "อัปเดตสำเร็จ"})
	}
}

// DeleteBill handles DELETE /api/bills/:id
// Deletes attachment from Storage if exists, then deletes the bill record.
func DeleteBill(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ ID ของบิล"})
		return
	}

	// Fetch bill to check for attachment
	var bills []map[string]interface{}
	if err := db.Client.Query("bills", fmt.Sprintf("select=*&id=eq.%s", billID), &bills); err != nil || len(bills) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบิลที่ระบุ"})
		return
	}

	bill := bills[0]

	// Delete attachment from storage if exists
	if attachURL, ok := bill["attachment_url"].(string); ok && attachURL != "" {
		// Extract storage path from the attachment_url
		storagePath := extractStoragePath(attachURL, billAttachmentBucket)
		if storagePath != "" {
			_ = db.Client.DeleteFile(billAttachmentBucket, storagePath)
		}
	}

	// Delete the bill record
	if err := db.Client.Delete("bills", fmt.Sprintf("id=eq.%s", billID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("ลบบิลไม่สำเร็จ: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบบิลสำเร็จ"})
}

// UploadBillAttachment handles POST /api/bills/:id/attachment
// Uploads or replaces the attachment file for a bill.
// Validates: image/jpeg, image/png, image/webp, application/pdf. Max 10MB.
func UploadBillAttachment(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ ID ของบิล"})
		return
	}

	// Verify the bill exists and get user_id
	var bills []map[string]interface{}
	if err := db.Client.Query("bills", fmt.Sprintf("select=id,user_id,attachment_url&id=eq.%s", billID), &bills); err != nil || len(bills) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบิลที่ระบุ"})
		return
	}

	bill := bills[0]
	userID, _ := bill["user_id"].(string)
	if userID == "" {
		userID = middleware.GetUserID(c)
	}

	fileHeader, err := c.FormFile("attachment")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาเลือกไฟล์แนบ (field: attachment)"})
		return
	}

	// Delete old attachment if exists
	if oldURL, ok := bill["attachment_url"].(string); ok && oldURL != "" {
		storagePath := extractStoragePath(oldURL, billAttachmentBucket)
		if storagePath != "" {
			_ = db.Client.DeleteFile(billAttachmentBucket, storagePath)
		}
	}

	attachmentURL, uploadErr := uploadBillAttachment(userID, billID, fileHeader)
	if uploadErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": uploadErr.Error()})
		return
	}

	// Update bill with new attachment_url
	updateData := map[string]interface{}{
		"attachment_url": attachmentURL,
	}
	var result []map[string]interface{}
	if err := db.Client.Update("bills", fmt.Sprintf("id=eq.%s", billID), updateData, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("อัปเดตบิลไม่สำเร็จ: %v", err)})
		return
	}

	if len(result) > 0 {
		c.JSON(http.StatusOK, result[0])
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "อัปโหลดไฟล์แนบสำเร็จ", "attachment_url": attachmentURL})
	}
}

// GetBillAttachment handles GET /api/bills/:id/attachment
// Returns a signed URL for the attachment (private bucket).
func GetBillAttachment(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ ID ของบิล"})
		return
	}

	// Fetch the bill to get attachment info
	var bills []map[string]interface{}
	if err := db.Client.Query("bills", fmt.Sprintf("select=id,attachment_url&id=eq.%s", billID), &bills); err != nil || len(bills) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบิลที่ระบุ"})
		return
	}

	bill := bills[0]
	attachURL, ok := bill["attachment_url"].(string)
	if !ok || attachURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "บิลนี้ไม่มีไฟล์แนบ"})
		return
	}

	// Extract storage path from the URL
	storagePath := extractStoragePath(attachURL, billAttachmentBucket)
	if storagePath == "" {
		// Fallback: return the stored URL directly
		c.JSON(http.StatusOK, gin.H{"url": attachURL})
		return
	}

	// Generate signed URL (valid for 1 hour)
	signedURL, err := db.Client.GetSignedURL(billAttachmentBucket, storagePath, 3600)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("สร้าง URL ไม่สำเร็จ: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": signedURL})
}

// --- Internal helpers ---

// uploadBillAttachment uploads a file and returns the storage path.
// Returns the full storage path (for use as attachment_url) and any error.
func uploadBillAttachment(userID, billID string, fileHeader *multipart.FileHeader) (string, error) {
	if fileHeader.Size > maxBillAttachmentSize {
		return "", fmt.Errorf("ไฟล์มีขนาดเกิน 10MB")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("ไม่สามารถอ่านไฟล์ได้")
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("ไม่สามารถอ่านไฟล์ได้")
	}

	// Detect content type from file content
	contentType := http.DetectContentType(fileBytes)

	if !allowedBillMIMETypes[contentType] {
		return "", fmt.Errorf("รองรับเฉพาะไฟล์ JPEG, PNG, WebP, PDF เท่านั้น")
	}

	// Use original filename, sanitized
	filename := filepath.Base(fileHeader.Filename)
	if filename == "" || filename == "." {
		filename = "attachment"
	}

	// Storage path: {user_id}/{bill_id}/{filename}
	storagePath := fmt.Sprintf("%s/%s/%s", userID, billID, filename)

	if err := db.Client.UploadFile(billAttachmentBucket, storagePath, fileBytes, contentType); err != nil {
		return "", fmt.Errorf("อัปโหลดไฟล์ไม่สำเร็จ: %v", err)
	}

	return storagePath, nil
}

// extractStoragePath extracts the object path from a Supabase Storage URL or stored path.
// If the stored value is already a relative path, it returns it as-is.
func extractStoragePath(urlOrPath, bucket string) string {
	// Check if it's a full URL containing the bucket path
	marker := fmt.Sprintf("/storage/v1/object/public/%s/", bucket)
	if idx := strings.Index(urlOrPath, marker); idx >= 0 {
		return urlOrPath[idx+len(marker):]
	}
	// Check signed URL pattern
	marker2 := fmt.Sprintf("/storage/v1/object/sign/%s/", bucket)
	if idx := strings.Index(urlOrPath, marker2); idx >= 0 {
		path := urlOrPath[idx+len(marker2):]
		// Remove query params from signed URLs
		if qIdx := strings.Index(path, "?"); qIdx >= 0 {
			path = path[:qIdx]
		}
		return path
	}
	// If no URL pattern found, assume it's already a relative path
	if !strings.Contains(urlOrPath, "://") {
		return urlOrPath
	}
	return ""
}
