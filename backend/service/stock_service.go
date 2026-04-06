package service

import (
	"errors"
	"fmt"
	"store-backend/db"
	"store-backend/models"
	"store-backend/repository"
	"time"
)

// StockService interface
type StockService interface {
	GetAllStock(branchID string) ([]models.Material, error)
	GetStockByID(id uint, branchID string) (*models.Material, error)
	CreateMaterial(branchID string, req CreateMaterialDTO) (*models.Material, error)
	UpdateMaterial(branchID string, id uint, req UpdateMaterialDTO) (*models.Material, error)
	DeleteMaterial(branchID string, id uint) error
	PurchaseMaterial(branchID string, req PurchaseRequestDTO) error
	SimplePurchaseMaterial(branchID string, userID string, req SimplePurchaseRequestDTO) error
	DeductMaterial(branchID string, req UsageRequestDTO) error
	GetPriceComparison(materialID uint) ([]models.SupplierComparison, error)
	GetAllPurchases(branchID string) ([]map[string]interface{}, error)
}

type stockService struct {
	repo repository.StockRepository
}

// NewStockService constructor
func NewStockService(repo repository.StockRepository) StockService {
	return &stockService{repo: repo}
}

type CreateMaterialDTO struct {
	Name          string  `json:"name" binding:"required"`
	CategoryID    uint    `json:"category_id" binding:"required"`
	Unit          string  `json:"unit" binding:"required"`
	InitialStock  float64 `json:"initial_stock"`
	MinStockLevel float64 `json:"min_stock_level"`
}

type UpdateMaterialDTO struct {
	Name          string  `json:"name"`
	CategoryID    uint    `json:"category_id"`
	Unit          string  `json:"unit"`
	MinStockLevel float64 `json:"min_stock_level"`
}

type PurchaseRequestDTO struct {
	MaterialID uint    `json:"material_id" binding:"required"`
	SupplierID uint    `json:"supplier_id" binding:"required"`
	Quantity   float64 `json:"quantity" binding:"required,gt=0"`
	TotalPrice float64 `json:"total_price" binding:"required,gt=0"`
	ReceiptNo  string  `json:"receipt_no"`
}

type SimplePurchaseRequestDTO struct {
	ItemName  string  `json:"item_name" binding:"required"`
	Unit      string  `json:"unit" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required,gt=0"`
	Price     float64 `json:"price" binding:"required,gt=0"`
	StoreName string  `json:"store_name"`
}

type UsageRequestDTO struct {
	MaterialID uint    `json:"material_id" binding:"required"`
	JobID      *uint   `json:"job_id"`
	Quantity   float64 `json:"quantity" binding:"required,gt=0"`
	Notes      string  `json:"notes"`
}

// CreateMaterial สร้างวัสดุใหม่ในสต๊อก
func (s *stockService) CreateMaterial(branchID string, req CreateMaterialDTO) (*models.Material, error) {
	material := &models.Material{
		BranchID:      branchID,
		Name:          req.Name,
		CategoryID:    req.CategoryID,
		Unit:          req.Unit,
		CurrentStock:  req.InitialStock, // กำหนดจำนวนเริ่มต้น
		MinStockLevel: req.MinStockLevel,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	err := s.repo.CreateMaterial(material)
	return material, err
}

// GetAllStock
func (s *stockService) GetAllStock(branchID string) ([]models.Material, error) {
	return s.repo.FindAllMaterials(branchID)
}

// GetStockByID
func (s *stockService) GetStockByID(id uint, branchID string) (*models.Material, error) {
	return s.repo.FindMaterialByID(id, branchID)
}

// UpdateMaterial
func (s *stockService) UpdateMaterial(branchID string, id uint, req UpdateMaterialDTO) (*models.Material, error) {
	material, err := s.repo.FindMaterialByID(id, branchID)
	if err != nil {
		return nil, errors.New("ไม่พบวัสดุที่ต้องการแก้ไข")
	}

	if req.Name != "" {
		material.Name = req.Name
	}
	if req.CategoryID != 0 {
		material.CategoryID = req.CategoryID
	}
	if req.Unit != "" {
		material.Unit = req.Unit
	}
	if req.MinStockLevel >= 0 {
		material.MinStockLevel = req.MinStockLevel
	}
	material.UpdatedAt = time.Now()

	err = s.repo.UpdateMaterial(material)
	return material, err
}

// DeleteMaterial
func (s *stockService) DeleteMaterial(branchID string, id uint) error {
	return s.repo.DeleteMaterial(id, branchID)
}

// PurchaseMaterial
func (s *stockService) PurchaseMaterial(branchID string, req PurchaseRequestDTO) error {
	// 1. ตรวจสอบว่าวัสดุมีอยู่จริงในสาขานี้ไหม
	material, err := s.repo.FindMaterialByID(req.MaterialID, branchID)
	if err != nil {
		return errors.New("ไม่พบข้อมูลวัสดุในสาขานี้")
	}

	// 2. อัปเดตยอดสต๊อกปัจจุบัน
	material.CurrentStock += req.Quantity
	material.UpdatedAt = time.Now()
	if err := s.repo.UpdateMaterial(material); err != nil {
		return fmt.Errorf("ไม่สามารถอัปเดตยอดสต๊อกได้: %v", err)
	}

	// 3. บันทึก Transaction การซื้อ (เพื่อเอาไว้เปรียบเทียบราคา)
	unitCost := req.TotalPrice / req.Quantity
	purchaseRecord := &models.PurchaseTransaction{
		BranchID:     branchID,
		MaterialID:   req.MaterialID,
		SupplierID:   req.SupplierID,
		Quantity:     req.Quantity,
		TotalPrice:   req.TotalPrice,
		UnitCost:     unitCost,
		PurchaseDate: time.Now(),
		ReceiptNo:    req.ReceiptNo,
	}

	return s.repo.InsertPurchase(purchaseRecord)
}

// DeductMaterial ระบบเบิกใช้: เช็คสต๊อกพอมั้ย -> หักยอด -> บันทึกประวัติการใช้
func (s *stockService) DeductMaterial(branchID string, req UsageRequestDTO) error {
	// 1. ดึงยอดปัจจุบันมาเช็ค
	material, err := s.repo.FindMaterialByID(req.MaterialID, branchID)
	if err != nil {
		return errors.New("ไม่พบข้อมูลวัสดุ")
	}

	// 2. ตรวจสอบสต๊อกคงเหลือ (Business Logic)
	if material.CurrentStock < req.Quantity {
		return fmt.Errorf("สต๊อกไม่พอ (คงเหลือ: %.2f, ต้องการใช้: %.2f)", material.CurrentStock, req.Quantity)
	}

	// 3. หักสต๊อก
	material.CurrentStock -= req.Quantity
	material.UpdatedAt = time.Now()
	if err := s.repo.UpdateMaterial(material); err != nil {
		return fmt.Errorf("ไม่สามารถหักยอดสต๊อกได้: %v", err)
	}

	// 4. บันทึกประวัติการใช้งาน
	usageRecord := &models.UsageTransaction{
		BranchID:     branchID,
		MaterialID:   req.MaterialID,
		JobID:        req.JobID,
		QuantityUsed: req.Quantity,
		UsageDate:    time.Now(),
		Notes:        req.Notes,
	}

	return s.repo.InsertUsage(usageRecord)
}

// GetPriceComparison ดึงประวัติการซื้อทั้งหมดของวัสดุชิ้นนี้มาเปรียบเทียบราคา (ราคาล่าสุดและราคาที่ถูกที่สุดของแต่ละร้าน)
func (s *stockService) GetPriceComparison(materialID uint) ([]models.SupplierComparison, error) {
	// 1. ดึงประวัติการซื้อทั้งหมดของวัสดุชิ้นนี้ (Repository ต้องทำ Join Supplier มาให้)
	rawPurchases, err := s.repo.GetPurchasesByMaterial(materialID)
	if err != nil {
		return nil, err
	}

	// 2. ใช้ Map ใน Go เพื่อหาค่า Min และ Last ของแต่ละ Supplier
	comparisonMap := make(map[string]models.SupplierComparison)

	for _, p := range rawPurchases {
		// ดึงข้อมูลชื่อ Supplier จาก Map (Supabase Join Result)
		sName := "ไม่ระบุชื่อร้าน"
		if supplier, ok := p["suppliers"].(map[string]interface{}); ok {
			sName = supplier["name"].(string)
		}

		unitCost := p["unit_cost"].(float64)
		purchaseDate, _ := time.Parse(time.RFC3339, p["purchase_date"].(string))

		if item, exists := comparisonMap[sName]; !exists {
			comparisonMap[sName] = models.SupplierComparison{
				SupplierName: sName,
				MinPrice:     unitCost,
				LastPrice:    unitCost,
				LastPurchase: purchaseDate,
			}
		} else {
			// หาค่าที่ถูกที่สุด
			if unitCost < item.MinPrice {
				item.MinPrice = unitCost
			}
			// หาค่าล่าสุด
			if purchaseDate.After(item.LastPurchase) {
				item.LastPrice = unitCost
				item.LastPurchase = purchaseDate
			}
			comparisonMap[sName] = item
		}
	}

	// 4. แปลงกลับเป็น Slice เพื่อ Return ให้ API
	var result []models.SupplierComparison
	for _, v := range comparisonMap {
		result = append(result, v)
	}

	return result, nil
}

func (s *stockService) GetAllPurchases(branchID string) ([]map[string]interface{}, error) {
	return s.repo.GetAllPurchases(branchID)
}

// SimplePurchaseMaterial creates or updates material by name (free text entry) and records as expense
func (s *stockService) SimplePurchaseMaterial(branchID string, userID string, req SimplePurchaseRequestDTO) error {
	// 1. Try to find existing material by name in this branch
	materials, err := s.repo.FindAllMaterials(branchID)
	if err != nil {
		return err
	}
	
	var material *models.Material
	for _, m := range materials {
		if m.Name == req.ItemName {
			material = &m
			break
		}
	}
	
	// 2. If not exists, create new material
	if material == nil {
		newMaterial := &models.Material{
			BranchID:      branchID,
			Name:          req.ItemName,
			Unit:          req.Unit,
			CurrentStock:  req.Quantity,
			MinStockLevel: 0,
			CategoryID:    1, // Default category
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := s.repo.CreateMaterial(newMaterial)
		if err != nil {
			return fmt.Errorf("ไม่สามารถสร้างวัสดุใหม่ได้: %v", err)
		}
		material = newMaterial
	} else {
		// 3. Update existing material stock
		material.CurrentStock += req.Quantity
		material.UpdatedAt = time.Now()
		if err := s.repo.UpdateMaterial(material); err != nil {
			return fmt.Errorf("ไม่สามารถอัปเดตยอดสต๊อกได้: %v", err)
		}
	}
	
	// 4. Record purchase transaction
	purchaseRecord := &models.PurchaseTransaction{
		BranchID:     branchID,
		MaterialID:   material.ID,
		SupplierID:   1, // Default supplier
		Quantity:     req.Quantity,
		TotalPrice:   req.Price,
		UnitCost:     req.Price / req.Quantity,
		PurchaseDate: time.Now(),
		ReceiptNo:    req.StoreName,
	}
	
	if err := s.repo.InsertPurchase(purchaseRecord); err != nil {
		return fmt.Errorf("ไม่สามารถบันทึกการซื้อได้: %v", err)
	}
	
	// 5. Record as expense for branch cost calculation
	storeInfo := req.StoreName
	if storeInfo == "" {
		storeInfo = "ไม่ระบุร้าน"
	}
	expenseRecord := map[string]interface{}{
		"branch_id":    branchID,
		"user_id":      userID,
		"title":        fmt.Sprintf("ซื้อวัสดุ: %s (%.2f %s) จาก %s", req.ItemName, req.Quantity, req.Unit, storeInfo),
		"amount":       req.Price,
		"note":         fmt.Sprintf("สั่งซื้อเข้าสต๊อก: %s %.2f %s", req.ItemName, req.Quantity, req.Unit),
		"expense_date": time.Now(),
	}
	
	var expenseResult []map[string]interface{}
	if err := db.Client.Insert("expenses", expenseRecord, &expenseResult); err != nil {
		// Log error but don't fail the whole transaction
		fmt.Printf("Warning: could not record expense: %v\n", err)
	}
	
	return nil
}
