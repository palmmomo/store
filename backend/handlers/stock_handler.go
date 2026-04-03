package handlers

import (
	"net/http"
	"strconv"

	"store-backend/backend/service"

	"github.com/gin-gonic/gin"
)

type StockHandler struct {
	srv service.StockService
}

func NewStockHandler(s service.StockService) *StockHandler {
	return &StockHandler{srv: s}
}

func (h *StockHandler) CreateStockItem(c *gin.Context) {
	var req service.CreateMaterialDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ครบถ้วน หรือรูปแบบไม่ถูกต้อง"})
		return
	}
	material, err := h.srv.CreateMaterial(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างวัสดุได้"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "เพิ่มวัสดุใหม่สำเร็จ", "data": material})
}

func (h *StockHandler) GetStock(c *gin.Context) {
	materials, err := h.srv.GetAllStock()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลสต๊อกได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": materials})
}

func (h *StockHandler) GetStockByID(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	material, err := h.srv.GetStockByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลวัสดุ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": material})
}

func (h *StockHandler) UpdateStockItem(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var req service.UpdateMaterialDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}

	material, err := h.srv.UpdateMaterial(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลวัสดุสำเร็จ", "data": material})
}

func (h *StockHandler) DeleteStockItem(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	if err := h.srv.DeleteMaterial(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบวัสดุสำเร็จ"})
}

func (h *StockHandler) PurchaseStock(c *gin.Context) {
	var req service.PurchaseRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := h.srv.PurchaseMaterial(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "รับของเข้าสต๊อกและคำนวณต้นทุนสำเร็จ"})
}

func (h *StockHandler) DeductStock(c *gin.Context) {
	var req service.UsageRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := h.srv.DeductMaterial(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "เบิกใช้งานและหักสต๊อกสำเร็จ"})
}
