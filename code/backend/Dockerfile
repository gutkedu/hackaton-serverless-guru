FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY container-package.json package.json
COPY package-lock.json* ./
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

FROM node:22-slim

WORKDIR /app

# Copy package files for production
COPY container-package.json package.json
COPY package-lock.json* ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "--enable-source-maps", "dist/container/index.js"]
