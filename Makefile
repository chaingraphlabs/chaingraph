.PHONY: clean install build dev test

# Очистка
clean:
	rm -rf packages/*/dist node_modules packages/*/node_modules packages/*/*.tsbuildinfo

# Очистка только сборочных артефактов
clean-dist:
	rm -rf packages/*/dist packages/*/*.tsbuildinfo

# Установка зависимостей
install:
	bun install

# Сборка всех пакетов
build: clean-dist install build-types build-nodes build-backend build-frontend

# Сборка отдельных пакетов
build-types:
	bun run --cwd packages/chaingraph-types build

build-nodes: build-types
	bun run --cwd packages/chaingraph-nodes build

build-backend: build-nodes
	bun run --cwd packages/chaingraph-backend build

build-frontend: build-backend
	bun run --cwd packages/chaingraph-frontend build

# Запуск в режиме разработки
dev:
	bun run --cwd packages/chaingraph-frontend dev & \
	bun run --cwd packages/chaingraph-backend dev

# Запуск тестов
test:
	vitest run

# Полная пересборка
rebuild: clean build

# По умолчанию
all: build