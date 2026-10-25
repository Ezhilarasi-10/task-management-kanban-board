/**
 * Database Module for Task Management Kanban Board
 * Uses SQLite with disk persistence (tasks.db) and parameterized queries.
 * Compatible with Node.js built-in node:sqlite (Node 22.5+) and better-sqlite3.
 */

const path = require('path');
const fs = require('fs');

const DEFAULT_DB_PATH = path.join(__dirname, 'tasks.db');

class DatabaseAdapter {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
    this.initDriver();
    this.configurePragmas();
    this.initSchema();
  }

  initDriver() {
    if (this.dbPath && this.dbPath !== ':memory:') {
      const dir = path.dirname(path.resolve(this.dbPath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // 1. Try Node.js built-in node:sqlite (native in Node 22.5+ / Node 24+)
    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(this.dbPath);
      this.driver = 'node:sqlite';
      return;
    } catch (err) {
      // Not on Node 22.5+ or node:sqlite unavailable
    }

    // 2. Fallback to better-sqlite3 if installed
    try {
      const BetterSqlite = require('better-sqlite3');
      this.db = new BetterSqlite(this.dbPath);
      this.driver = 'better-sqlite3';
      return;
    } catch (err) {
      // Better-sqlite3 not found
    }

    throw new Error(
      'No compatible SQLite driver found. Please ensure Node.js 22.5+ (built-in node:sqlite) or better-sqlite3 is installed.'
    );
  }

  configurePragmas() {
    try {
      // WAL mode for improved concurrent read/write performance
      if (this.dbPath !== ':memory:') {
        this.db.exec('PRAGMA journal_mode = WAL;');
      }
      this.db.exec('PRAGMA foreign_keys = ON;');
    } catch (e) {
      // In-memory or restricted environments might ignore some pragmas
    }
  }

  initSchema() {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL CHECK(status IN ('todo', 'in_progress', 'done')),
        priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
        due_date TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `;

    this.db.exec(schemaSql);
    this.autoSeedIfEmpty();
  }

  queryAll(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  queryOne(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) || null;
  }

  execute(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid)
    };
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  autoSeedIfEmpty() {
    const countRow = this.queryOne('SELECT COUNT(*) as count FROM tasks');
    if (countRow && countRow.count === 0) {
      this.seedSampleTasks();
    }
  }

  seedSampleTasks() {
    const today = new Date();
    const formatDate = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const sampleTasks = [
      {
        title: 'Design Database Schema & ER Diagram',
        description: 'Define SQLite tables, data types, indexes, and write initial migration scripts for the Kanban board.',
        status: 'done',
        priority: 'high',
        due_date: formatDate(-2)
      },
      {
        title: 'Develop REST API Endpoints in Express',
        description: 'Implement full CRUD routes, input validation middleware, error handling, and stats aggregation endpoint.',
        status: 'done',
        priority: 'high',
        due_date: formatDate(-1)
      },
      {
        title: 'Build Interactive Kanban Board UI',
        description: 'Create column layout for To Do, In Progress, and Done with smooth drag-and-drop and fallback dropdowns.',
        status: 'in_progress',
        priority: 'high',
        due_date: formatDate(2)
      },
      {
        title: 'Implement Search, Filters, and Sorting',
        description: 'Allow users to filter tasks by priority or status, search titles/descriptions, and sort by due date.',
        status: 'in_progress',
        priority: 'medium',
        due_date: formatDate(4)
      },
      {
        title: 'Write Automated Test Suite & Documentation',
        description: 'Write integration tests for all API endpoints, configure CI workflow, and create the viva presentation guide.',
        status: 'todo',
        priority: 'medium',
        due_date: formatDate(6)
      },
      {
        title: 'Prepare Presentation Slides & Project Report',
        description: 'Summarize system architecture, features, and key learnings for the computer science semester viva evaluation.',
        status: 'todo',
        priority: 'low',
        due_date: formatDate(8)
      }
    ];

    const insertSql = `
      INSERT INTO tasks (title, description, status, priority, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    for (const task of sampleTasks) {
      this.execute(insertSql, [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.due_date
      ]);
    }
  }

  resetWithSamples() {
    this.clearAllTasks();
    this.seedSampleTasks();
  }

  clearAllTasks() {
    this.db.exec('DELETE FROM tasks;');
    try {
      this.db.exec("DELETE FROM sqlite_sequence WHERE name = 'tasks';");
    } catch (e) {
      // sqlite_sequence might not exist yet if no rows were autoincremented
    }
  }

  close() {
    if (this.db && typeof this.db.close === 'function') {
      this.db.close();
    }
  }
}

// Singleton instance for standard server runtime
const dbInstance = new DatabaseAdapter(process.env.DB_PATH || DEFAULT_DB_PATH);

module.exports = {
  db: dbInstance,
  DatabaseAdapter
};
