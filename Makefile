# ChainGraph Project Makefile

.PHONY: all build prepublish-check publish publish-packages clean

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
	pnpm --filter @badaitech/chaingraph-types publish --access restricted --no-git-checks
	pnpm --filter @badaitech/chaingraph-nodes publish --access restricted --no-git-checks
	pnpm --filter @badaitech/chaingraph-trpc publish --access restricted --no-git-checks
	pnpm --filter @badaitech/chaingraph-backend publish --access restricted --no-git-checks
	pnpm --filter @badaitech/chaingraph-frontend publish --access restricted --no-git-checks
	pnpm --filter @badaitech/badai-api publish --access restricted --no-git-checks
	# Root package should be published last
	pnpm publish --access restricted --no-git-checks
	@echo "All packages have been published!"


# Clean build outputs
clean-builds:
	@echo "Cleaning build outputs..."
	rm -rf **/dist
	rm -rf **/build
	rm -rf **/coverage
	rm -rf **/*.tsbuildinfo
	@echo "Build outputs cleaned!"

# Clean cache
clean-cache:
	@echo "Cleaning cache..."
	rm -rf .turbo
	rm -rf .cache
	@echo "Cache cleaned!"

# Clean everything
clean: clean-builds clean-cache
	@echo "Project cleaned successfully!"