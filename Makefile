# ChainGraph Project Makefile

.PHONY: all build prepublish-check publish publish-packages clean \
	db-migrate-build db-migrate-run db-migrate

# Default target - only builds the project
all: build

# Build all packages
build:
	pnpm run build

# Run prepublish checks (linting, testing)
prepublish-check:
	pnpm run prepublish-check

# Full publish workflow: check -> build -> publish
publish: prepublish-check build publish-packages

# Publish all packages individually
publish-packages:
	@echo "Publishing all packages..."
	pnpm --filter @badaitech/chaingraph-types publish --access restricted
	pnpm --filter @badaitech/chaingraph-nodes publish --access restricted
	pnpm --filter @badaitech/chaingraph-trpc publish --access restricted
	pnpm --filter @badaitech/chaingraph-backend publish --access restricted
	pnpm --filter @badaitech/chaingraph-frontend publish --access restricted
	pnpm --filter @badaitech/badai-api publish --access restricted
	# Root package should be published last
	pnpm publish --access restricted --no-git-checks
	@echo "All packages have been published!"


# Clean build outputs
clean-builds:
	@echo "Cleaning build outputs..."
	rm -rf ./dist/
	rm -rf ./build/
	rm -rf ./coverage/
	rm -rf ./*/**/dist/
	rm -rf ./*/**/build/
	rm -rf ./*/**/coverage/
	rm -rf ./*/**/*.tsbuildinfo
	@echo "Build outputs cleaned!"

# Clean cache
clean-cache:
	@echo "Cleaning cache..."
	rm -rf ./.turbo
	rm -rf ./.cache
	@echo "Cache cleaned!"

# Clean everything
clean: clean-builds clean-cache
	@echo "Project cleaned successfully!"

# Database migration commands
# ----------------------------------------------------------------

# Name of the migration Docker image
MIGRATION_IMAGE := badaitech/chaingraph-migration

# Path to the migration Dockerfile
MIGRATION_DOCKERFILE := apps/chaingraph-backend/migrate.Dockerfile

# Build the migration Docker image
db-migrate-build:
	@echo "Building database migration Docker image..."
	docker build -t $(MIGRATION_IMAGE) -f $(MIGRATION_DOCKERFILE) .
	@echo "Migration image built successfully!"

# Run database migrations with the specified DATABASE_URL
# Usage: make db-migrate-run DATABASE_URL="postgres://username:password@hostname:5432/dbname"
db-migrate-run:
ifndef DATABASE_URL
	@echo "Error: DATABASE_URL is required"
	@echo "Usage: make db-migrate-run DATABASE_URL=\"postgres://username:password@hostname:5432/dbname\""
	@exit 1
endif
	@echo "Running database migrations..."
	docker run --rm -e DATABASE_URL="$(DATABASE_URL)" $(MIGRATION_IMAGE)
	@echo "Database migrations completed!"

# Build migration image and run migrations in one command
# Usage: make db-migrate DATABASE_URL="postgres://username:password@hostname:5432/dbname"
db-migrate: db-migrate-build db-migrate-run