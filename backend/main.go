package main

import (
	"encoding/base64"
	"io/ioutil"
	"net/http"
	"shareapp/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("shares.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	db.AutoMigrate(&models.Share{})

	go func() {
		for {
			models.CleanupOldShares(db)
			time.Sleep(24 * time.Hour)
		}
	}()

	r := gin.Default()

	// 更新 CORS 配置以支持更多源
	r.Use(func(c *gin.Context) {
		// 获取请求的 Origin
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			// 如果没有 Origin 头，允许所有来源
			origin = "*"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/shares", func(c *gin.Context) {
		var shares []models.Share
		db.Order("created_at desc").Find(&shares)
		c.JSON(http.StatusOK, shares)
	})

	r.POST("/share", func(c *gin.Context) {
		contentType := "text"
		var content string

		file, _ := c.FormFile("file")
		if file != nil {
			contentType = "image"
			f, _ := file.Open()
			bytes, _ := ioutil.ReadAll(f)
			content = base64.StdEncoding.EncodeToString(bytes)
		} else {
			content = c.PostForm("content")
		}

		share := models.Share{
			Content:   content,
			Type:      contentType,
			CreatedAt: time.Now(),
		}

		db.Create(&share)
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	r.DELETE("/share/:id", func(c *gin.Context) {
		id := c.Param("id")
		db.Delete(&models.Share{}, id)
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// 监听所有网络接口
	r.Run(":21108")
}
