package handlers

import (
	"net/http"
	"store-backend/middleware"
	"store-backend/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type StockHandler struct {
	srv service.StockService
}

func NewStockHandler(s service.StockService) *StockHandler {
	return &StockHandler{srv: s}
}

// 1. ดึงรายการสต๊อกทั้งหมดของสาขา
func (h *StockHandler) GetStock(c *gin.Context) {
	res, err := h.srv.GetAllStock(middleware.GetBranchID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// 2. เพิ่มวัสดุใหม่เข้าสต๊อก
func (h *StockHandler) CreateStockItem(c *gin.Context) {
	var req service.CreateMaterialDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	res, err := h.srv.CreateMaterial(middleware.GetBranchID(c), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// 3. ดึงข้อมูลวัสดุรายชิ้น (ที่ Error อยู่)
func (h *StockHandler) GetStockByID(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	res, err := h.srv.GetStockByID(uint(id), middleware.GetBranchID(c))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลวัสดุ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// 4. แก้ไขข้อมูลวัสดุ (ที่ Error อยู่)
func (h *StockHandler) UpdateStockItem(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var req service.UpdateMaterialDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	res, err := h.srv.UpdateMaterial(middleware.GetBranchID(c), uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// 5. ลบตารางวัสดุ
func (h *StockHandler) DeleteStockItem(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	err := h.srv.DeleteMaterial(middleware.GetBranchID(c), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบข้อมูลได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลสำเร็จ"})
}

// 6. บันทึกการซื้อของเข้าสต๊อก
func (h *StockHandler) PurchaseStock(c *gin.Context) {
	var req service.PurchaseRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	err := h.srv.PurchaseMaterial(middleware.GetBranchID(c), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกสต๊อกสำเร็จ"})
}

// 7. บันทึกการเบิกใช้งาน
func (h *StockHandler) DeductStock(c *gin.Context) {
	var req service.UsageRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	err := h.srv.DeductMaterial(middleware.GetBranchID(c), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "เบิกใช้งานสำเร็จ"})
}

// 8. เปรียบเทียบราคาคู่ค้า
func (h *StockHandler) GetComparison(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("material_id"), 10, 32)
	res, err := h.srv.GetPriceComparison(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// 9. ประวัติการซื้อทั้งหมดของสาขา
func (h *StockHandler) GetPurchaseHistory(c *gin.Context) {
	res, err := h.srv.GetAllPurchases(middleware.GetBranchID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// 10. บันทึกการซื้อแบบง่าย (รับชื่อวัสดุเป็นข้อความ)
func (h *StockHandler) SimplePurchaseStock(c *gin.Context) {
	var req service.SimplePurchaseRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}
	err := h.srv.SimplePurchaseMaterial(middleware.GetBranchID(c), middleware.GetUserID(c), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกสต๊อกและค่าใช้จ่ายสำเร็จ"})
}
