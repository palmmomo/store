package service

import (
	"errors"
	"time"

	"store-backend/backend/models"
	"store-backend/backend/repository"
)

type StockService interface {
	CreateMaterial(req CreateMaterialDTO) (*models.Material, error)
	GetAllStock() ([]models.Material, error)
	GetStockByID(id uint) (*models.Material, error)
	UpdateMaterial(id uint, req UpdateMaterialDTO) (*models.Material, error)
	DeleteMaterial(id uint) error
	PurchaseMaterial(req PurchaseRequestDTO) error
	DeductMaterial(req UsageRequestDTO) error
}

type stockService struct {
	repo repository.StockRepository
}

func NewStockService(repo repository.StockRepository) StockService {
	return &stockService{repo: repo}
}

type CreateMaterialDTO struct {
	Name          string  `json:"name" binding:"required"`
	CategoryID    uint    `json:"category_id" binding:"required"`
	Unit          string  `json:"unit" binding:"required"`
	MinStockLevel float64 `json:"min_stock_level" binding:"min=0"`
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
	TotalPrice float64 `json:"total_price" binding:"required,min=0"`
	ReceiptNo  string  `json:"receipt_no"`
}

type UsageRequestDTO struct {
	MaterialID uint    `json:"material_id" binding:"required"`
	JobID      *uint   `json:"job_id"`
	Quantity   float64 `json:"quantity" binding:"required,gt=0"`
	Notes      string  `json:"notes"`
}

func (s *stockService) CreateMaterial(req CreateMaterialDTO) (*models.Material, error) {
	material := &models.Material{
		Name:          req.Name,
		CategoryID:    req.CategoryID,
		Unit:          req.Unit,
		CurrentStock:  0,
		MinStockLevel: req.MinStockLevel,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	err := s.repo.CreateMaterial(material)
	return material, err
}

func (s *stockService) GetAllStock() ([]models.Material, error) {
	return s.repo.FindAllMaterials()
}

func (s *stockService) GetStockByID(id uint) (*models.Material, error) {
	return s.repo.FindMaterialByID(id)
}

func (s *stockService) UpdateMaterial(id uint, req UpdateMaterialDTO) (*models.Material, error) {
	material, err := s.repo.FindMaterialByID(id)
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

func (s *stockService) DeleteMaterial(id uint) error {
	return s.repo.DeleteMaterial(id)
}

func (s *stockService) PurchaseMaterial(req PurchaseRequestDTO) error {
	unitCost := req.TotalPrice / req.Quantity
	purchaseRecord := models.PurchaseTransaction{
		MaterialID:   req.MaterialID,
		SupplierID:   req.SupplierID,
		Quantity:     req.Quantity,
		TotalPrice:   req.TotalPrice,
		UnitCost:     unitCost,
		PurchaseDate: time.Now(),
		ReceiptNo:    req.ReceiptNo,
	}
	return s.repo.RecordPurchaseTx(&purchaseRecord)
}

func (s *stockService) DeductMaterial(req UsageRequestDTO) error {
	usageRecord := models.UsageTransaction{
		MaterialID:   req.MaterialID,
		JobID:        req.JobID,
		QuantityUsed: req.Quantity,
		UsageDate:    time.Now(),
		Notes:        req.Notes,
	}
	return s.repo.RecordUsageTx(&usageRecord)
}
