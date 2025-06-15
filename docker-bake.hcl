variable "REGISTRY" {
  default = "ghcr.io"
}

variable "GITHUB_TOKEN" {
  default = ""
}

variable "TAG" {
  default = "latest"
}

variable "BACK_VERSION" {
  default = "${TAG}"
}

variable "FRONT_VERSION" {
  default = "${TAG}"
}

variable "CONTEXT" {
  default = "."
}

group "default" {
  targets = ["backend", "frontend"]
}

group "all" {
  targets = ["backend", "frontend"]
}

target "backend" {
  dockerfile = "Dockerfile"
  target     = "backend"
  context    = "${CONTEXT}"
  args {
    GITHUB_TOKEN = "${GITHUB_TOKEN}"
  }
  tags = [
    "${REGISTRY}/chaingraph-backend:${BACK_VERSION}",
    "${REGISTRY}/chaingraph-backend:latest"
  ]
  platforms = [
    "linux/amd64",
    # "linux/arm64"
  ]
  cache-from = [
    "type=gha"
  ]
  cache-to = [
    "type=gha,mode=max"
  ]
}

target "frontend" {
  dockerfile = "Dockerfile"
  target     = "frontend"
  context    = "${CONTEXT}"
  tags = [
    "${REGISTRY}/chaingraph-frontend:${FRONT_VERSION}",
    "${REGISTRY}/chaingraph-frontend:latest"
  ]
  platforms = [
    "linux/amd64",
    # "linux/arm64"
  ]
  cache-from = [
    "type=gha"
  ]
  cache-to = [
    "type=gha,mode=max"
  ]
}
