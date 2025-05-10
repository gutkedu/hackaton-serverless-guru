FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY container-package.json package.json
COPY package-lock.json* ./
RUN npm i

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build
# For debugging: verify the dist directory
RUN ls -la /app

FROM node:22-slim

WORKDIR /app

# Copy package files for production
COPY container-package.json package.json
COPY package-lock.json* ./

# Install production dependencies
RUN npm i --omit=dev

# Copy compiled code from builder - corrected path
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "--enable-source-maps", "dist/container/server.js"]
