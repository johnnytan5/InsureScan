.PHONY: help dev install clean

help: ## Show this help message
	@echo "Available commands:"
	@echo "  make dev       - Run all services (frontend + Python backend)"
	@echo "  make install   - Install all dependencies"
	@echo "  make clean     - Clean all build artifacts and caches"
	@echo ""
	@echo "Individual services:"
	@echo "  make frontend  - Run frontend only"
	@echo "  make backend   - Run Python backend only"

dev: ## Run all services at once
	npm run dev

install: ## Install all dependencies
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Installing Python dependencies..."
	cd backend && uv sync
	@echo "✅ All dependencies installed!"

frontend: ## Run frontend only
	npm run dev:frontend

backend: ## Run Python backend only
	npm run dev:backend

clean: ## Clean all build artifacts and caches
	@echo "Cleaning Node.js artifacts..."
	@npm run clean 2>nul || echo "Done"
	@echo "Cleaning Python artifacts..."
	@cd backend && powershell -Command "Remove-Item -Path __pycache__,*.pyc,.pytest_cache,.coverage -Recurse -Force -ErrorAction SilentlyContinue"
	@echo "✅ Cleanup complete!"
