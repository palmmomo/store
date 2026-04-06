package repository

import (
	"fmt"
	"store-backend/db"
	"store-backend/models"
)

type StockRepository interface {
	CreateMaterial(m *models.Material) error
	FindAllMaterials(branchID string) ([]models.Material, error)
	FindMaterialByID(id uint, branchID string) (*models.Material, error)
	UpdateMaterial(m *models.Material) error
	DeleteMaterial(id uint, branchID string) error
	InsertPurchase(p *models.PurchaseTransaction) error
	InsertUsage(u *models.UsageTransaction) error
	GetPurchasesByMaterial(materialID uint) ([]map[string]interface{}, error)
	GetAllPurchases(branchID string) ([]map[string]interface{}, error)
}

type stockRepository struct{}

func NewStockRepository() StockRepository { return &stockRepository{} }

func (r *stockRepository) CreateMaterial(m *models.Material) error {
	var res []models.Material
	return db.Client.Insert("materials", m, &res)
}

func (r *stockRepository) FindAllMaterials(branchID string) ([]models.Material, error) {
	var res []models.Material
	err := db.Client.Query("materials", fmt.Sprintf("branch_id=eq.%s&select=*", branchID), &res)
	return res, err
}

func (r *stockRepository) FindMaterialByID(id uint, branchID string) (*models.Material, error) {
	var res []models.Material
	query := fmt.Sprintf("id=eq.%d&branch_id=eq.%s&select=*", id, branchID)
	err := db.Client.Query("materials", query, &res)
	if err != nil || len(res) == 0 {
		return nil, fmt.Errorf("ไม่พบวัสดุ")
	}
	return &res[0], nil
}

func (r *stockRepository) UpdateMaterial(m *models.Material) error {
	var res []models.Material
	return db.Client.Update("materials", fmt.Sprintf("id=eq.%d", m.ID), m, &res)
}

func (r *stockRepository) DeleteMaterial(id uint, branchID string) error {
	return db.Client.Delete("materials", fmt.Sprintf("id=eq.%d&branch_id=eq.%s", id, branchID))
}

func (r *stockRepository) InsertPurchase(p *models.PurchaseTransaction) error {
	var res []models.PurchaseTransaction
	return db.Client.Insert("purchase_transactions", p, &res)
}

func (r *stockRepository) InsertUsage(u *models.UsageTransaction) error {
	var res []models.UsageTransaction
	return db.Client.Insert("usage_transactions", u, &res)
}

func (r *stockRepository) GetPurchasesByMaterial(id uint) ([]map[string]interface{}, error) {
	var res []map[string]interface{}
	// Join กับตาราง suppliers เพื่อเอาชื่อร้าน
	err := db.Client.Query("purchase_transactions", fmt.Sprintf("material_id=eq.%d&select=*,suppliers(name)", id), &res)
	return res, err
}

func (r *stockRepository) GetAllPurchases(branchID string) ([]map[string]interface{}, error) {
	var res []map[string]interface{}
	// Join กับ materials เพื่อเอาชื่อวัสดุ และ suppliers เพื่อเอาชื่อร้าน
	query := fmt.Sprintf("branch_id=eq.%s&select=*,materials(name),suppliers(name)&order=purchase_date.desc", branchID)
	err := db.Client.Query("purchase_transactions", query, &res)
	return res, err
}
