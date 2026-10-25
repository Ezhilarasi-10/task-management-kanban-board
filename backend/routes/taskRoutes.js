/**
 * Task Routes definition
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Aggregate statistics
router.get('/stats', taskController.getTaskStats);

// Reset demo sample tasks
router.post('/reset', taskController.resetSampleTasks);

// List tasks with optional filtering & sorting
router.get('/', taskController.getAllTasks);

// Single task details
router.get('/:id', taskController.getTaskById);

// Create task
router.post('/', taskController.createTask);

// Full update task
router.put('/:id', taskController.updateTask);

// Quick update status (Drag & Drop / Dropdown)
router.patch('/:id/status', taskController.updateTaskStatus);

// Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
