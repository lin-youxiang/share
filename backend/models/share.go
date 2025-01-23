package models

import (
	"time"

	"gorm.io/gorm"
)

type Share struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
}

func CleanupOldShares(db *gorm.DB) {
	thirtyDaysAgo := time.Now().AddDate(0, 0, -180)
	db.Where("created_at < ?", thirtyDaysAgo).Delete(&Share{})
}
