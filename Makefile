# SchoolPlatform developer commands. Run `make help` for the list.
# Requires: Docker (Compose v2), Node.js 24 LTS + npm, uv (Python), bash.
# On Windows use Git Bash or WSL with GNU make installed.

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

COMPOSE ?= docker compose
UV      ?= uv
API_DIR := apps/api
s       ?=

.PHONY: help env certs up down logs ps migrate makemigration seed test test-api test-e2e \
        lint format gen-client backup restore-check

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

env: ## Create .env from .env.example if it does not exist
	@test -f .env && echo ".env already exists" || (cp .env.example .env && echo "Created .env — replace the change-me values")

certs: ## Generate self-signed dev TLS certificates for localhost
	bash infra/scripts/dev_certs.sh

up: env certs ## Build and start the dev stack (detached)
	$(COMPOSE) up -d --build

down: ## Stop the stack (volumes are kept)
	$(COMPOSE) down

logs: ## Follow logs (optionally for one service: make logs s=api)
	$(COMPOSE) logs -f --tail=200 $(s)

ps: ## Show service status
	$(COMPOSE) ps

migrate: ## Apply database migrations (alembic upgrade head)
	$(COMPOSE) run --rm api alembic upgrade head

makemigration: ## Autogenerate a migration: make makemigration m="add students table"
	@test -n "$(m)" || (echo 'Usage: make makemigration m="message"' && exit 1)
	$(COMPOSE) run --rm api alembic revision --autogenerate -m "$(m)"

seed: ## Seed the default tenant and reference data
	$(COMPOSE) run --rm api python -m app.seed

test: test-api ## Run backend and frontend unit/integration tests
	npm test

test-api: ## Run API tests (unit, integration, tenant isolation) inside the dev container
	$(COMPOSE) run --rm api pytest

test-e2e: ## Run Playwright E2E tests against the running stack
	E2E_IGNORE_HTTPS_ERRORS=1 npm run test:e2e

lint: ## Lint and type-check everything
	npm run lint
	npm run format:check
	npm run typecheck
	@if [ -f $(API_DIR)/pyproject.toml ]; then \
		$(UV) run --directory $(API_DIR) ruff check . && \
		$(UV) run --directory $(API_DIR) ruff format --check . && \
		$(UV) run --directory $(API_DIR) mypy && \
		$(UV) run --directory $(API_DIR) lint-imports --config importlinter.ini; \
	else echo "apps/api not scaffolded yet — skipping Python checks"; fi

format: ## Auto-format code
	npm run format
	@if [ -f $(API_DIR)/pyproject.toml ]; then \
		$(UV) run --directory $(API_DIR) ruff check --fix . && \
		$(UV) run --directory $(API_DIR) ruff format .; \
	fi

gen-client: ## Generate the TypeScript API client from the OpenAPI schema
	npm run gen-client

backup: ## Dump MySQL to ./backups (compressed, with checksum)
	$(COMPOSE) --profile ops run --rm backup /scripts/backup_mysql.sh

restore-check: ## Restore the latest backup into a scratch DB and run sanity checks (f=<file> optional)
	$(COMPOSE) --profile ops run --rm backup /scripts/restore_check.sh $(if $(f),/backups/$(notdir $(f)),)
