import React from 'react';
import { 
  GraduationCap, 
  Database, 
  Server, 
  Layout, 
  HelpCircle
} from 'lucide-react';

export const VivaInfoGuide: React.FC = () => {
  const vivaQuestions = [
    {
      q: '1. What is the architecture of this application?',
      a: 'It is a full-stack Single Page Application (SPA) with a decoupled 3-tier architecture: Frontend (React 18 + TypeScript + Vite), Backend (Node.js + Express.js REST API), and Database (Persistent SQLite engine with WAL mode and parameterized prepared statements).'
    },
    {
      q: '2. Why use SQLite instead of localStorage or in-memory arrays?',
      a: 'SQLite provides true ACID-compliant relational persistence, transactions, and structured indexing directly on the server filesystem. Browser localStorage only persists on a single client device and cannot support multi-user collaboration or centralized server-side data integrity.'
    },
    {
      q: '3. How is SQL Injection prevented?',
      a: 'All SQL operations strictly use parameterized queries (prepared statements with ? placeholders). User input is never concatenated directly into SQL strings, preventing malicious SQL code injection.'
    },
    {
      q: '4. How does the drag-and-drop mechanism work?',
      a: 'We leverage the native HTML5 Drag and Drop API. On drag start, the task ID is encoded into dataTransfer. When dropped onto a column zone, the destination status is extracted and an asynchronous PATCH /api/tasks/:id/status request is sent to the backend. An accessible dropdown is also provided as a WCAG-compliant keyboard and mobile fallback.'
    },
    {
      q: '5. Why use TypeScript instead of plain JavaScript?',
      a: 'TypeScript provides compile-time static type checking, eliminating whole classes of runtime errors (like null reference errors or misnamed API fields), enhances IDE autocomplete, and serves as living documentation for data models.'
    },
    {
      q: '6. How are dashboard statistics calculated?',
      a: "Statistics are calculated server-side in real time via the GET /api/tasks/stats endpoint using aggregate SQL queries (COUNT(*), WHERE status = ..., WHERE due_date < date('now')). They are never hardcoded or approximated in the frontend."
    }
  ];

  return (
    <div className="viva-guide-container">
      {/* Hero Banner */}
      <div className="viva-hero-card">
        <div className="viva-hero-icon-box">
          <GraduationCap size={28} />
        </div>
        <div className="viva-hero-text">
          <h2>Task Management Kanban Board — College Project Evaluation Guide</h2>
          <p>
            Comprehensive technical briefing, architectural breakdown, and viva interview defense questions.
          </p>
        </div>
      </div>

      {/* Tech Stack Breakdown */}
      <div className="viva-section">
        <h3 className="viva-section-title">
          <Layout size={18} />
          <span>Full-Stack Architecture & Technology Stack</span>
        </h3>
        <div className="tech-cards-grid">
          <div className="tech-card">
            <div className="tech-card-header">
              <span className="badge-tech">Frontend</span>
              <h4>React + TypeScript + Vite</h4>
            </div>
            <ul>
              <li>Component-driven SPA architecture with React 18 hooks.</li>
              <li>Strict TypeScript typing for compile-time safety.</li>
              <li>Vite build tool for ultra-fast HMR and bundle optimization.</li>
              <li>Lucide React icons and responsive CSS design system.</li>
            </ul>
          </div>

          <div className="tech-card">
            <div className="tech-card-header">
              <span className="badge-tech">Backend</span>
              <h4>Node.js + Express.js</h4>
            </div>
            <ul>
              <li>RESTful API design following HTTP status conventions.</li>
              <li>Helmet security headers and configurable CORS.</li>
              <li>Centralized input validation and error handling.</li>
              <li>Automated integration test suite with Node test runner.</li>
            </ul>
          </div>

          <div className="tech-card">
            <div className="tech-card-header">
              <span className="badge-tech">Database</span>
              <h4>Persistent SQLite Engine</h4>
            </div>
            <ul>
              <li>File-based relational database (`tasks.db`).</li>
              <li>Write-Ahead Logging (WAL) for high concurrency.</li>
              <li>Indexes on `status`, `priority`, and `due_date`.</li>
              <li>Zero external daemon setup needed — portable and reliable.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Database Schema */}
      <div className="viva-section">
        <h3 className="viva-section-title">
          <Database size={18} />
          <span>Relational Database Schema (`tasks` table)</span>
        </h3>
        <div className="schema-table-wrapper">
          <table className="schema-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>id</code></td>
                <td>INTEGER</td>
                <td>PRIMARY KEY AUTOINCREMENT</td>
                <td>Unique surrogate identifier for each task</td>
              </tr>
              <tr>
                <td><code>title</code></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Task title (trimmed, max 200 characters)</td>
              </tr>
              <tr>
                <td><code>description</code></td>
                <td>TEXT</td>
                <td>DEFAULT &apos;&apos;</td>
                <td>Detailed description, notes, or acceptance criteria</td>
              </tr>
              <tr>
                <td><code>status</code></td>
                <td>TEXT</td>
                <td>NOT NULL, CHECK (todo, in_progress, done)</td>
                <td>Current stage of the task in the Kanban flow</td>
              </tr>
              <tr>
                <td><code>priority</code></td>
                <td>TEXT</td>
                <td>NOT NULL, CHECK (low, medium, high)</td>
                <td>Task urgency and business priority</td>
              </tr>
              <tr>
                <td><code>due_date</code></td>
                <td>TEXT</td>
                <td>DEFAULT NULL</td>
                <td>Target deadline in ISO format (YYYY-MM-DD)</td>
              </tr>
              <tr>
                <td><code>created_at</code></td>
                <td>TEXT</td>
                <td>DEFAULT (datetime(&apos;now&apos;))</td>
                <td>Timestamp of initial record creation</td>
              </tr>
              <tr>
                <td><code>updated_at</code></td>
                <td>TEXT</td>
                <td>DEFAULT (datetime(&apos;now&apos;))</td>
                <td>Timestamp of latest status or content modification</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* REST API Endpoints Reference */}
      <div className="viva-section">
        <h3 className="viva-section-title">
          <Server size={18} />
          <span>REST API Endpoint Specifications</span>
        </h3>
        <div className="api-endpoints-grid">
          <div className="api-row"><span className="http-badge get">GET</span> <code>/health</code> <span className="desc">Server uptime and database health check</span></div>
          <div className="api-row"><span className="http-badge get">GET</span> <code>/api/tasks</code> <span className="desc">List tasks with search, priority, status filter & sorting</span></div>
          <div className="api-row"><span className="http-badge get">GET</span> <code>/api/tasks/stats</code> <span className="desc">Aggregated statistics: counts, completion rate, overdue</span></div>
          <div className="api-row"><span className="http-badge get">GET</span> <code>/api/tasks/:id</code> <span className="desc">Retrieve a specific task record by primary key</span></div>
          <div className="api-row"><span className="http-badge post">POST</span> <code>/api/tasks</code> <span className="desc">Create new task with strict server-side validation</span></div>
          <div className="api-row"><span className="http-badge put">PUT</span> <code>/api/tasks/:id</code> <span className="desc">Full update of an existing task</span></div>
          <div className="api-row"><span className="http-badge patch">PATCH</span> <code>/api/tasks/:id/status</code> <span className="desc">Drag-and-drop status update (To Do, In Progress, Done)</span></div>
          <div className="api-row"><span className="http-badge delete">DELETE</span> <code>/api/tasks/:id</code> <span className="desc">Delete task permanently after user confirmation</span></div>
          <div className="api-row"><span className="http-badge post">POST</span> <code>/api/tasks/reset</code> <span className="desc">Reset database to clean demo sample tasks</span></div>
        </div>
      </div>

      {/* Viva Q&A Accordion */}
      <div className="viva-section">
        <h3 className="viva-section-title">
          <HelpCircle size={18} />
          <span>Expected Viva Interview Questions & Answers</span>
        </h3>
        <div className="viva-qa-list">
          {vivaQuestions.map((item, idx) => (
            <div key={idx} className="viva-qa-card">
              <h4 className="viva-qa-question">{item.q}</h4>
              <p className="viva-qa-answer">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
