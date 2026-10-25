/**
 * API Integration Tests for Task Management Kanban Board
 * Uses Node.js built-in test runner (node:test) and supertest
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { db } = require('../database');

describe('Task Management REST API Test Suite', () => {
  before(() => {
    // Reset database to known sample state before running tests
    db.resetWithSamples();
  });

  after(() => {
    // Optional cleanup
  });

  // 1. Health Check
  test('GET /health returns healthy status and database connection', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'connected');
    assert.ok(typeof res.body.uptime === 'number');
  });

  // 2. Root API Info
  test('GET / returns API metadata and endpoints list', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.ok(res.body.endpoints);
  });

  // 3. GET /api/tasks
  test('GET /api/tasks retrieves seeded tasks', async () => {
    const res = await request(app).get('/api/tasks');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 6);
  });

  // 4. GET /api/tasks/stats
  test('GET /api/tasks/stats returns calculated statistics', async () => {
    const res = await request(app).get('/api/tasks/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const stats = res.body.data;
    assert.ok(stats.total >= 6);
    assert.equal(stats.total, stats.completed + stats.in_progress + stats.pending);
    assert.ok(stats.completion_rate >= 0 && stats.completion_rate <= 100);
    assert.ok(stats.by_priority);
    assert.ok('high' in stats.by_priority);
  });

  // 5. POST /api/tasks - Success
  let createdTaskId;
  test('POST /api/tasks creates a new task with valid data', async () => {
    const newTask = {
      title: 'Automated Test Task',
      description: 'Created during test execution to verify POST endpoint.',
      priority: 'high',
      status: 'todo',
      due_date: '2026-12-31'
    };

    const res = await request(app)
      .post('/api/tasks')
      .send(newTask);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, 'Automated Test Task');
    assert.equal(res.body.data.priority, 'high');
    assert.equal(res.body.data.status, 'todo');
    assert.equal(res.body.data.due_date, '2026-12-31');
    assert.ok(res.body.data.id > 0);
    createdTaskId = res.body.data.id;
  });

  // 6. POST /api/tasks - Validation Failures
  test('POST /api/tasks rejects empty or whitespace title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '   ', priority: 'medium' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /title is required/i);
  });

  test('POST /api/tasks rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid Title', status: 'invalid_status' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /invalid status/i);
  });

  test('POST /api/tasks rejects invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid Title', priority: 'critical' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /invalid priority/i);
  });

  test('POST /api/tasks rejects invalid date format', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid Title', due_date: '31-12-2026' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /invalid due date/i);
  });

  // 7. GET /api/tasks/:id
  test('GET /api/tasks/:id returns single task by ID', async () => {
    const res = await request(app).get(`/api/tasks/${createdTaskId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, createdTaskId);
  });

  test('GET /api/tasks/:id returns 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/tasks/999999');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test('GET /api/tasks/:id returns 400 for invalid ID format', async () => {
    const res = await request(app).get('/api/tasks/abc');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  // 8. PUT /api/tasks/:id
  test('PUT /api/tasks/:id updates all task fields', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .send({
        title: 'Updated Task Title',
        description: 'Updated task description',
        priority: 'low',
        status: 'in_progress',
        due_date: '2026-11-15'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, 'Updated Task Title');
    assert.equal(res.body.data.priority, 'low');
    assert.equal(res.body.data.status, 'in_progress');
  });

  // 9. PATCH /api/tasks/:id/status
  test('PATCH /api/tasks/:id/status updates task status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdTaskId}/status`)
      .send({ status: 'done' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'done');
  });

  test('PATCH /api/tasks/:id/status rejects invalid status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdTaskId}/status`)
      .send({ status: 'blocked' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  // 10. Filters & Search
  test('GET /api/tasks with search query returns matching results', async () => {
    const res = await request(app).get('/api/tasks?search=Schema');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    assert.ok(res.body.data[0].title.includes('Schema'));
  });

  test('GET /api/tasks with status filter returns only matching tasks', async () => {
    const res = await request(app).get('/api/tasks?status=done');
    assert.equal(res.status, 200);
    for (const t of res.body.data) {
      assert.equal(t.status, 'done');
    }
  });

  test('GET /api/tasks with priority filter returns only matching tasks', async () => {
    const res = await request(app).get('/api/tasks?priority=high');
    assert.equal(res.status, 200);
    for (const t of res.body.data) {
      assert.equal(t.priority, 'high');
    }
  });

  // 11. DELETE /api/tasks/:id
  test('DELETE /api/tasks/:id removes task from database', async () => {
    const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify task no longer exists
    const checkRes = await request(app).get(`/api/tasks/${createdTaskId}`);
    assert.equal(checkRes.status, 404);
  });

  test('DELETE /api/tasks/:id returns 404 if task does not exist', async () => {
    const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
    assert.equal(res.status, 404);
  });

  // 12. Input Boundary Validation
  test('POST /api/tasks rejects title exceeding 200 characters', async () => {
    const longTitle = 'A'.repeat(201);
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: longTitle, priority: 'low' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /cannot exceed 200 characters/i);
  });

  // 13. Missing ID updates
  test('PUT /api/tasks/:id returns 404 for non-existent ID', async () => {
    const res = await request(app)
      .put('/api/tasks/888888')
      .send({ title: 'Non Existent' });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test('PATCH /api/tasks/:id/status returns 404 for non-existent ID', async () => {
    const res = await request(app)
      .patch('/api/tasks/888888/status')
      .send({ status: 'done' });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  // 14. Sorting verification
  test('GET /api/tasks?sort=priority_desc returns tasks sorted by high priority first', async () => {
    const res = await request(app).get('/api/tasks?sort=priority_desc');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 2);
    assert.equal(res.body.data[0].priority, 'high');
  });

  // 15. Reset demo sample tasks endpoint
  test('POST /api/tasks/reset re-populates database with demo sample tasks', async () => {
    const res = await request(app).post('/api/tasks/reset');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.count >= 6);
  });
});
