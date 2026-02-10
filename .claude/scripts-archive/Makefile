# nself-chat Makefile
# Common development commands

.PHONY: help install dev build test lint format clean docker release

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

##@ General

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n${BLUE}nself-chat${NC} - White-label team communication platform\n\nUsage:\n  make ${GREEN}<target>${NC}\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  ${GREEN}%-15s${NC} %s\n", $$1, $$2 } /^##@/ { printf "\n${YELLOW}%s${NC}\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Development

install: ## Install dependencies
	pnpm install

dev: ## Start development server
	pnpm dev

dev-turbo: ## Start development server with Turbo
	pnpm dev:turbo

##@ Build

build: ## Build web application
	./scripts/build-web.sh

build-all: ## Build all targets (web, desktop, mobile, docker)
	./scripts/build-all.sh

build-web: ## Build web application
	./scripts/build-web.sh

build-desktop: ## Build desktop applications (Tauri + Electron)
	./scripts/build-desktop.sh

build-mobile: ## Build mobile applications
	./scripts/build-mobile.sh

build-tauri: ## Build Tauri desktop app
	./scripts/build-tauri-all.sh

build-electron: ## Build Electron desktop app
	./scripts/build-electron-all.sh

build-analyze: ## Build with bundle analysis
	./scripts/build-web.sh --analyze

##@ Testing

test: ## Run unit tests
	pnpm test

test-all: ## Run all tests (unit + e2e)
	./scripts/test-all.sh

test-watch: ## Run tests in watch mode
	pnpm test:watch

test-coverage: ## Run tests with coverage
	./scripts/test-all.sh --coverage

test-e2e: ## Run E2E tests
	pnpm test:e2e

test-e2e-ui: ## Run E2E tests with UI
	pnpm test:e2e:ui

##@ Code Quality

lint: ## Run linter
	pnpm lint

lint-fix: ## Run linter and fix issues
	./scripts/lint-all.sh --fix

format: ## Format code with Prettier
	pnpm format

format-check: ## Check code formatting
	pnpm format:check

type-check: ## Run TypeScript type check
	./scripts/type-check.sh

type-check-watch: ## Run TypeScript type check in watch mode
	./scripts/type-check.sh --watch

check: lint type-check test ## Run all checks (lint, type-check, test)

##@ Docker

docker: ## Build Docker image
	docker build -t nself-chat:latest .

docker-run: ## Run Docker container
	docker run -p 3000:3000 --env-file .env.local nself-chat:latest

docker-compose: ## Start with Docker Compose
	docker-compose up -d

docker-compose-down: ## Stop Docker Compose
	docker-compose down

##@ Backend (nself)

backend-start: ## Start backend services
	pnpm backend:start

backend-stop: ## Stop backend services
	pnpm backend:stop

backend-status: ## Check backend status
	pnpm backend:status

backend-logs: ## View backend logs
	pnpm backend:logs

##@ Database

db-migrate: ## Run database migrations
	pnpm db:migrate

db-seed: ## Seed database
	pnpm db:seed

db-types: ## Generate TypeScript types from database
	pnpm db:types

db-studio: ## Open database studio
	pnpm db:studio

##@ Production

prod: build ## Build for production
	NODE_ENV=production pnpm start

start: ## Start production server
	pnpm start

##@ Release

release-patch: ## Release patch version (0.0.x)
	./scripts/release.sh --patch

release-minor: ## Release minor version (0.x.0)
	./scripts/release.sh --minor

release-major: ## Release major version (x.0.0)
	./scripts/release.sh --major

release-dry: ## Preview release (dry run)
	./scripts/release.sh --patch --dry-run

version: ## Show current version
	@node -p "require('./package.json').version"

##@ Cleanup

clean: ## Clean build artifacts
	./scripts/clean.sh

clean-all: ## Clean everything including node_modules
	./scripts/clean.sh --all

##@ Utilities

update: ## Update dependencies
	pnpm update

outdated: ## Check for outdated dependencies
	pnpm outdated

audit: ## Run security audit
	pnpm audit

deps: ## Show dependency tree
	pnpm list --depth=0

size: ## Analyze bundle size
	pnpm build:analyze
