#!/bin/bash
set -e

# Configuration variables
IMAGE_NAME="backend-app"
BUILD_DATE=$(date +%Y%m%d%H%M%S)

# Get the root directory of the project
ROOT_DIR=$(cd "$(dirname "$0")/../../" && pwd)
cd $ROOT_DIR

echo "Building Docker image with cache-busting..."

# Build Docker image with build args for cache busting
docker build \
  --no-cache \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  -t $IMAGE_NAME:latest \
  -f Dockerfile .

echo "Image built successfully: $IMAGE_NAME:latest"
echo "To run locally: docker run -p 3000:3000 $IMAGE_NAME:latest"
