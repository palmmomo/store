package api

import (
	"net/http"

	"store-backend/app"
)

// Handler is the entry point for Vercel Serverless
func Handler(w http.ResponseWriter, r *http.Request) {
	app.InitApp()
	app.Engine.ServeHTTP(w, r)
}
