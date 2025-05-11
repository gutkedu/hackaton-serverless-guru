FROM node:22-slim AS builder

ARG BUILD_DATE=unknown
ENV BUILD_DATE=${BUILD_DATE}

WORKDIR /app

# Copy package files and install dependencies
COPY container-package.json package.json
COPY package-lock.json* ./
RUN npm i

# Add a marker with the build date to invalidate cache
RUN echo "Build date: $BUILD_DATE" > build_info.txt

# Copy source files and build configuration
COPY tsconfig.json ./
COPY esbuild.container.mjs ./
COPY src ./src

RUN npm run build

FROM node:22-slim

ARG BUILD_DATE=unknown
ENV BUILD_DATE=${BUILD_DATE}

WORKDIR /app

# Copy package files for production
COPY container-package.json package.json
COPY package-lock.json* ./

# Install production dependencies
RUN npm i --omit=dev

# Add a marker with the build date to invalidate cache
RUN echo "Build date: $BUILD_DATE" > build_info.txt

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "--enable-source-maps", "dist/container/server.js"]
