/**
 * Task Management Kanban Board - Backend Server
 * Express.js REST API with SQLite database persistence
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const taskRoutes = require('./routes/taskRoutes');
const { getHealth } = require('./controllers/taskController');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint
app.get('/health', getHealth);

// API Routes
app.use('/api/tasks', taskRoutes);

const path = require('path');
const fs = require('fs');

// Check for built frontend assets
const frontendDist = process.env.CLIENT_DIST_PATH || path.join(__dirname, '../frontend/dist');
const hasFrontendDist = fs.existsSync(frontendDist);

if (hasFrontendDist) {
  app.use(express.static(frontendDist, { index: false }));
}

// Root informational endpoint (serves index.html for web browsers, JSON for API clients)
app.get('/', (req, res) => {
  const acceptHeader = req.headers['accept'] || '';
  if (hasFrontendDist && acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  res.status(200).json({
    name: 'Task Management Kanban Board API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      tasks: 'GET /api/tasks',
      stats: 'GET /api/tasks/stats',
      taskById: 'GET /api/tasks/:id',
      createTask: 'POST /api/tasks',
      updateTask: 'PUT /api/tasks/:id',
      updateStatus: 'PATCH /api/tasks/:id/status',
      deleteTask: 'DELETE /api/tasks/:id',
      resetTasks: 'POST /api/tasks/reset'
    }
  });
});

// SPA client fallback for browser navigation
if (hasFrontendDist) {
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
      return next();
    }
    if (req.accepts('html')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload.'
    });
  }

  // Log error internally in non-test mode
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]:', err);
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Only listen if executed directly (enables supertest in test files)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Kanban Board API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Base: http://localhost:${PORT}/api/tasks`);
    console.log(`=========================================`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('\nReceived kill signal, shutting down gracefully...');
    server.close(() => {
      console.log('Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;
