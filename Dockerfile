# ==============================================================================
# Multi-Stage Production Dockerfile for Task Management Kanban Board
# Stage 1: Build the React TypeScript frontend
# Stage 2: Package the Node.js Express backend and serve full-stack application
# ==============================================================================

# --- Stage 1: Build Frontend ---
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependency manifests
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies strictly from package-lock
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Run type check and produce optimized production bundle in /app/frontend/dist
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:22-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/tasks.db
ENV CLIENT_DIST_PATH=/app/frontend/dist

# Install production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy backend application source
COPY backend/server.js ./
COPY backend/database.js ./
COPY backend/controllers/ ./controllers/
COPY backend/routes/ ./routes/

# Copy built frontend bundle from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create persistent storage directory for SQLite database
RUN mkdir -p /app/data

# Expose backend port
EXPOSE 5000

# Health check to ensure Express and SQLite are healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.js"]
