#!/bin/bash
set -e

# Configuration variables
AWS_REGION="us-east-1"
AWS_PROFILE="gutkedu-terraform"
ECR_REPOSITORY_NAME="hackaton-container-app"
IMAGE_TAG=latest

# Get the root directory of the project
ROOT_DIR=$(cd "$(dirname "$0")/../../" && pwd)
# Docker files are now in the root directory
DOCKER_DIR="${ROOT_DIR}"

# Step 1: Build the Docker image locally with no cache
echo "Building Docker image with cache-busting..."
docker build -t $ECR_REPOSITORY_NAME:$IMAGE_TAG --build-arg NODE_ENV=production --build-arg BUILD_DATE="$IMAGE_TAG" -f "$DOCKER_DIR/Dockerfile" "$ROOT_DIR"

# Step 2: Create ECR repository if it doesn't exist
echo "Creating ECR repository if it doesn't exist..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION --profile $AWS_PROFILE || \
aws ecr create-repository --repository-name $ECR_REPOSITORY_NAME --region $AWS_REGION --profile $AWS_PROFILE

# Step 3: Get the ECR login command
echo "Getting ECR login..."
aws_account_id=$(aws sts get-caller-identity --query Account --output text --profile $AWS_PROFILE)
ecr_uri="$aws_account_id.dkr.ecr.$AWS_REGION.amazonaws.com"

# Log in to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | \
docker login --username AWS --password-stdin $ecr_uri

# Step 4: Tag and push the image to ECR
echo "Tagging and pushing image to ECR..."
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $ecr_uri/$ECR_REPOSITORY_NAME:$IMAGE_TAG
docker push $ecr_uri/$ECR_REPOSITORY_NAME:$IMAGE_TAG

# Output the full image URI for use with SAM deployment
FULL_IMAGE_URI="$ecr_uri/$ECR_REPOSITORY_NAME:$IMAGE_TAG"
echo "Image pushed successfully: $FULL_IMAGE_URI"

# Also tag as latest and push
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $ecr_uri/$ECR_REPOSITORY_NAME:latest
docker push $ecr_uri/$ECR_REPOSITORY_NAME:latest
echo "Latest tag also pushed"

# Output the image URI and tag for deployment
echo "FULL_IMAGE_URI=$FULL_IMAGE_URI"
echo "LATEST_IMAGE_URI=$ecr_uri/$ECR_REPOSITORY_NAME:latest"

