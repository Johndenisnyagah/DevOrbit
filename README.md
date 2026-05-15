# DevOrbit - Task Management for Software Developers

DevOrbit is a lightweight, locally hosted task management app built for software developers who need to preserve context while moving between tasks.

It combines a Flask + SQLite backend with a React/Vite frontend. The current UI uses a dark dashboard style inspired by compact analytics interfaces: a left navigation rail, status bars, priority indicators, focused task cards, activity logs, context snapshots, and standup reporting.

## What DevOrbit Helps With

Developers lose time when they switch tasks without capturing what they were doing. DevOrbit is designed around that problem:

| Workflow | How DevOrbit Supports It |
|---|---|
| Start focused work | Move a task from `ToDo` to `InProgress` |
| Pause without losing context | Save a context snapshot when pausing a task |
| Track interruptions | Log interruptions while a task is in progress |
| Avoid overload | Show a cognitive load warning at 3 or more active tasks |
| Prepare updates | Generate a daily standup summary from task state and logs |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-CORS |
| Database | SQLite |
| Frontend | React, React Router, Vite |
| Styling | Custom CSS dark dashboard design system |
| Animation | Framer Motion for toast and menu transitions |

## Prerequisites

Install these before running the app:

```bash
python --version
node --version
npm --version
```

Recommended versions:

```text
Python 3.10+
Node.js 18+
npm 9+
```

On Windows, your Python command may be `python`, `py`, or `python3` depending on how Python was installed.

## Setup

### 1. Install backend dependencies

From the project root:

```bash
pip install -r requirements.txt
```

### 2. Install frontend dependencies

From the `frontend` folder:

```bash
cd frontend
npm install
```

## Running Locally

DevOrbit uses two local dev servers: Flask for the API and Vite for the React UI.

### 1. Start the Flask API

From the project root:

```bash
python app.py
```

The API runs at:

```text
http://127.0.0.1:5000
```

### 2. Start the React frontend

In a second terminal, from the `frontend` folder:

```bash
npm run dev
```

Open the app at:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies `/api` requests to the Flask API on port `5000`, so the frontend can call paths such as `/api/tasks` without hardcoding a backend host.

## Core Features

| Feature | Description |
|---|---|
| Task Dashboard | Overview with status bars, counts, priority cards, active work, and task queue |
| Task Creation | Create tasks with title, optional description, and priority |
| Status Transitions | Enforces valid movement between `ToDo`, `InProgress`, `Paused`, and `Done` |
| Context Snapshot | Saves where you left off before pausing or resuming later |
| Interruption Logger | Records unplanned interruptions while a task is in progress |
| Cognitive Load Warning | Warns when 3 or more tasks are `InProgress` |
| Activity Log | Tracks status changes, snapshots, and interruptions for each task |
| Standup Summary | Groups daily work into completed, in-progress, paused, and interrupted sections |

## Task Status Flow

DevOrbit intentionally limits task movement so state remains predictable.

```text
ToDo -> InProgress

InProgress -> Paused
InProgress -> Done

Paused -> InProgress
Paused -> Done

Done -> terminal
```

Invalid transitions are rejected by the API. For example, a task cannot move directly from `ToDo` to `Done`.

## Project Structure

```text
devorbit/
|-- app.py                 Flask JSON API and route handlers
|-- database.py            SQLite connection and table creation
|-- devorbit.db            Local SQLite database
|-- requirements.txt       Python dependencies
|-- README.md              Project documentation
|-- frontend/
|   |-- src/
|   |   |-- api.js         Frontend API wrapper
|   |   |-- App.jsx        React shell, shared state, and routes
|   |   |-- index.css      Current dark dashboard design system
|   |   |-- components/
|   |   |   |-- Icons.jsx   Shared inline SVG icon component
|   |   |   |-- Sidebar.jsx Left navigation and filters
|   |   |   `-- Toast.jsx   Toast notifications
|   |   `-- pages/
|   |       |-- TasksPage.jsx       Dashboard and task queue
|   |       |-- TaskDetailPage.jsx  Task detail, actions, logs
|   |       |-- TaskCreatePage.jsx  New task form
|   |       |-- SnapshotPage.jsx    Context snapshot form
|   |       `-- StandupPage.jsx     Daily summary
|   |-- package.json       Frontend scripts and dependencies
|   `-- vite.config.js     Vite config and API proxy
|-- templates/             Legacy Flask-rendered templates
`-- static/                Legacy Flask-rendered styles
```

The `templates/` and `static/` folders are legacy server-rendered UI assets. The active UI is the React app in `frontend/src`.

## Backend API

Base URL:

```text
http://127.0.0.1:5000/api
```

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/tasks` | List tasks with active-count metadata |
| `POST` | `/tasks` | Create a new task |
| `GET` | `/tasks/<id>` | Get a task, activity logs, latest snapshot, and valid next states |
| `PATCH` | `/tasks/<id>/status` | Move a task to a valid next status |
| `POST` | `/tasks/<id>/snapshot` | Save a context snapshot |
| `POST` | `/tasks/<id>/interrupt` | Log an interruption |
| `GET` | `/standup` | Generate the daily standup data |

### Create Task Request

```json
{
  "title": "Fix auth refresh flow",
  "description": "Refresh token path fails after expiry.",
  "priority": "High"
}
```

Allowed priorities:

```text
High, Medium, Low
```

### Update Status Request

```json
{
  "status": "Paused"
}
```

If a task is moved to `Paused`, the API response includes:

```json
{
  "redirect_snapshot": true
}
```

The frontend uses this to send the user to the context snapshot page.

## Database Schema

The SQLite database is created automatically by `database.py` when the backend starts.

### `tasks`

Stores the main task records.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `title` | Required task title |
| `description` | Optional task details |
| `priority` | `High`, `Medium`, or `Low` |
| `status` | `ToDo`, `InProgress`, `Paused`, or `Done` |
| `created_at` | Local creation timestamp |
| `updated_at` | Local update timestamp |

### `context_snapshots`

Stores restart context for paused or resumed tasks.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `task_id` | Related task |
| `content` | Saved context note |
| `created_at` | Snapshot timestamp |

### `activity_logs`

Stores task history.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `task_id` | Related task |
| `event_type` | `StatusChange`, `Interruption`, or `Snapshot` |
| `content` | Log message |
| `timestamp` | Log timestamp |

## Frontend Routes

| Route | Screen |
|---|---|
| `/` | Dashboard and task queue |
| `/tasks/new` | Create task |
| `/tasks/:id` | Task detail |
| `/tasks/:id/snapshot` | Save context snapshot |
| `/standup` | Daily standup summary |

## Useful Commands

Run frontend linting:

```bash
cd frontend
npm run lint
```

Build the frontend:

```bash
cd frontend
npm run build
```

Preview the production build:

```bash
cd frontend
npm run preview
```

## Troubleshooting

### Frontend loads but no tasks appear

Make sure the Flask API is running at:

```text
http://127.0.0.1:5000
```

Then check:

```text
http://127.0.0.1:5000/api/tasks
```

### `npm` is blocked in PowerShell on Windows

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

### Flask dependency errors

Reinstall backend dependencies:

```bash
pip install -r requirements.txt
```

### Port already in use

The default ports are:

```text
Backend:  5000
Frontend: 5173
```

Stop the existing process or configure the server to use a different port.

## Notes for Future Development

- The React frontend is the active UI.
- The Flask templates are legacy and can be removed after confirming no server-rendered flow is needed.
- The API currently uses SQLite directly with simple route handlers, which keeps the app easy to reason about.
- The task state machine lives in `app.py` as `VALID_TRANSITIONS`.
- The visual design system lives primarily in `frontend/src/index.css`.
