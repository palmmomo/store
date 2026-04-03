package repository

import (
	"fmt"

	"store-backend/backend/db"
	"store-backend/backend/models"
)

type StockRepository interface {
	CreateMaterial(material *models.Material) error
	FindAllMaterials() ([]models.Material, error)
	FindMaterialByID(id uint) (*models.Material, error)
	UpdateMaterial(material *models.Material) error
	DeleteMaterial(id uint) error
	RecordPurchaseTx(purchase *models.PurchaseTransaction) error
	RecordUsageTx(usage *models.UsageTransaction) error
}

type stockRepository struct{}

func NewStockRepository() StockRepository {
	return &stockRepository{}
}

func (r *stockRepository) CreateMaterial(material *models.Material) error {
	var result []models.Material
	err := db.Client.Insert("materials", material, &result)
	if err == nil && len(result) > 0 {
		*material = result[0]
	}
	return err
}

func (r *stockRepository) FindAllMaterials() ([]models.Material, error) {
	var materials []models.Material
	err := db.Client.Query("materials", "select=*", &materials)
	return materials, err
}

func (r *stockRepository) FindMaterialByID(id uint) (*models.Material, error) {
	var materials []models.Material
	err := db.Client.Query("materials", fmt.Sprintf("id=eq.%d&select=*", id), &materials)
	if err != nil {
		return nil, err
	}
	if len(materials) == 0 {
		return nil, fmt.Errorf("ไม่พบข้อมูลวัสดุ")
	}
	return &materials[0], nil
}

func (r *stockRepository) UpdateMaterial(material *models.Material) error {
	var result []models.Material
	err := db.Client.Update("materials", fmt.Sprintf("id=eq.%d", material.ID), material, &result)
	if err == nil && len(result) > 0 {
		*material = result[0]
	}
	return err
}

func (r *stockRepository) DeleteMaterial(id uint) error {
	return db.Client.Delete("materials", fmt.Sprintf("id=eq.%d", id))
}

func (r *stockRepository) RecordPurchaseTx(purchase *models.PurchaseTransaction) error {
	params := map[string]interface{}{
		"p_material_id": purchase.MaterialID,
		"p_supplier_id": purchase.SupplierID,
		"p_quantity":    purchase.Quantity,
		"p_total_price": purchase.TotalPrice,
		"p_unit_cost":   purchase.UnitCost,
		"p_receipt_no":  purchase.ReceiptNo,
	}
	return db.Client.RPC("purchase_stock", params, nil)
}

func (r *stockRepository) RecordUsageTx(usage *models.UsageTransaction) error {
	params := map[string]interface{}{
		"p_material_id": usage.MaterialID,
		"p_job_id":      usage.JobID,
		"p_quantity":    usage.QuantityUsed,
		"p_notes":       usage.Notes,
	}
	return db.Client.RPC("deduct_stock", params, nil)
}
