/**
 * Task Controller - Business logic and validation for Task Management
 */

const { db } = require('../database');

// Helper to validate YYYY-MM-DD date strings
function isValidDate(dateString) {
  if (!dateString) return true; // Null or empty is allowed
  if (typeof dateString !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// Allowed enum values
const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

/**
 * Health check endpoint
 */
exports.getHealth = (req, res) => {
  try {
    const row = db.queryOne('SELECT 1 as alive');
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: row && row.alive === 1 ? 'connected' : 'unresponsive',
      driver: db.driver || 'sqlite'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
};

/**
 * GET /api/tasks
 * Filter by search, status, priority; sort by date, priority, or created_at
 */
exports.getAllTasks = (req, res, next) => {
  try {
    const { search, status, priority, sort } = req.query;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    // Filter: Search across title and description
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    // Filter: Status
    if (status) {
      const normalizedStatus = status.toLowerCase();
      if (VALID_STATUSES.includes(normalizedStatus)) {
        query += ' AND status = ?';
        params.push(normalizedStatus);
      }
    }

    // Filter: Priority
    if (priority) {
      const normalizedPriority = priority.toLowerCase();
      if (VALID_PRIORITIES.includes(normalizedPriority)) {
        query += ' AND priority = ?';
        params.push(normalizedPriority);
      }
    }

    // Sorting logic
    let orderBy = ' ORDER BY created_at DESC';
    switch (sort) {
      case 'due_date_asc':
        // Null due dates last
        orderBy = ' ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, id ASC';
        break;
      case 'due_date_desc':
        orderBy = ' ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date DESC, id DESC';
        break;
      case 'priority_desc':
        orderBy = ` ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 4 
          END ASC, id DESC`;
        break;
      case 'priority_asc':
        orderBy = ` ORDER BY 
          CASE priority 
            WHEN 'low' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'high' THEN 3 
            ELSE 4 
          END ASC, id DESC`;
        break;
      case 'created_at_asc':
        orderBy = ' ORDER BY created_at ASC, id ASC';
        break;
      case 'created_at_desc':
      default:
        orderBy = ' ORDER BY created_at DESC, id DESC';
        break;
    }

    query += orderBy;

    const tasks = db.queryAll(query, params);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/stats
 * Aggregates dashboard analytics
 */
exports.getTaskStats = (req, res, next) => {
  try {
    const totalRow = db.queryOne('SELECT COUNT(*) as count FROM tasks');
    const total = totalRow ? totalRow.count : 0;

    const completedRow = db.queryOne("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'");
    const completed = completedRow ? completedRow.count : 0;

    const inProgressRow = db.queryOne("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'");
    const in_progress = inProgressRow ? inProgressRow.count : 0;

    const pendingRow = db.queryOne("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'");
    const pending = pendingRow ? pendingRow.count : 0;

    const highPriorityRow = db.queryOne("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high'");
    const mediumPriorityRow = db.queryOne("SELECT COUNT(*) as count FROM tasks WHERE priority = 'medium'");
    const lowPriorityRow = db.queryOne("SELECT COUNT(*) as count FROM tasks WHERE priority = 'low'");

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueRow = db.queryOne(
      "SELECT COUNT(*) as count FROM tasks WHERE due_date IS NOT NULL AND due_date < ? AND status != 'done'",
      [todayStr]
    );

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        in_progress,
        pending,
        completion_rate: completionRate,
        by_priority: {
          high: highPriorityRow ? highPriorityRow.count : 0,
          medium: mediumPriorityRow ? mediumPriorityRow.count : 0,
          low: lowPriorityRow ? lowPriorityRow.count : 0
        },
        overdue: overdueRow ? overdueRow.count : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/:id
 */
exports.getTaskById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format. Must be a positive integer.'
      });
    }

    const task = db.queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks
 * Create a new task with strict input validation
 */
exports.createTask = (req, res, next) => {
  try {
    let { title, description, status = 'todo', priority = 'medium', due_date } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required and cannot be empty or whitespace.'
      });
    }

    title = title.trim();
    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Task title cannot exceed 200 characters.'
      });
    }

    // Validate description
    description = description ? String(description).trim() : '';
    if (description.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Task description cannot exceed 2000 characters.'
      });
    }

    // Validate status
    const normalizedStatus = String(status).toLowerCase().trim();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}.`
      });
    }

    // Validate priority
    const normalizedPriority = String(priority).toLowerCase().trim();
    if (!VALID_PRIORITIES.includes(normalizedPriority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid priority "${priority}". Allowed values: ${VALID_PRIORITIES.join(', ')}.`
      });
    }

    // Validate due_date
    if (due_date && due_date.trim()) {
      due_date = due_date.trim();
      if (!isValidDate(due_date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid due date format. Expected YYYY-MM-DD.'
        });
      }
    } else {
      due_date = null;
    }

    const insertSql = `
      INSERT INTO tasks (title, description, status, priority, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const result = db.execute(insertSql, [
      title,
      description,
      normalizedStatus,
      normalizedPriority,
      due_date
    ]);

    const createdTask = db.queryOne('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * Full update of task
 */
exports.updateTask = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format.'
      });
    }

    const existing = db.queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${id} not found.`
      });
    }

    let { title, description, status, priority, due_date } = req.body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Task title cannot be empty or whitespace.'
        });
      }
      title = title.trim();
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          error: 'Task title cannot exceed 200 characters.'
        });
      }
    } else {
      title = existing.title;
    }

    // Validate description if provided
    if (description !== undefined) {
      description = String(description).trim();
      if (description.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Task description cannot exceed 2000 characters.'
        });
      }
    } else {
      description = existing.description;
    }

    // Validate status if provided
    if (status !== undefined) {
      status = String(status).toLowerCase().trim();
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}.`
        });
      }
    } else {
      status = existing.status;
    }

    // Validate priority if provided
    if (priority !== undefined) {
      priority = String(priority).toLowerCase().trim();
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: `Invalid priority "${priority}". Allowed values: ${VALID_PRIORITIES.join(', ')}.`
        });
      }
    } else {
      priority = existing.priority;
    }

    // Validate due_date if provided
    if (due_date !== undefined) {
      if (due_date && String(due_date).trim()) {
        due_date = String(due_date).trim();
        if (!isValidDate(due_date)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid due date format. Expected YYYY-MM-DD.'
          });
        }
      } else {
        due_date = null;
      }
    } else {
      due_date = existing.due_date;
    }

    const updateSql = `
      UPDATE tasks 
      SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = datetime('now')
      WHERE id = ?
    `;

    db.execute(updateSql, [title, description, status, priority, due_date, id]);

    const updatedTask = db.queryOne('SELECT * FROM tasks WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id/status
 * Update status only (used for drag-and-drop & status dropdown)
 */
exports.updateTaskStatus = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format.'
      });
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Status field is required.'
      });
    }

    const normalizedStatus = status.toLowerCase().trim();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const existing = db.queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${id} not found.`
      });
    }

    db.execute(
      "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [normalizedStatus, id]
    );

    const updatedTask = db.queryOne('SELECT * FROM tasks WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 */
exports.deleteTask = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format.'
      });
    }

    const existing = db.queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${id} not found.`
      });
    }

    db.execute('DELETE FROM tasks WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      deleted_id: id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks/reset
 * Reset database to default sample tasks (useful for testing and viva demos)
 */
exports.resetSampleTasks = (req, res, next) => {
  try {
    db.resetWithSamples();
    const tasks = db.queryAll('SELECT * FROM tasks ORDER BY created_at DESC');

    res.status(200).json({
      success: true,
      message: 'Database reset to default sample tasks successfully.',
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};
