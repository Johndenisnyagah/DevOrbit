# DevOrbit - Task Management for Software Developers

DevOrbit is a lightweight, locally hosted task management app built for software developers who need to preserve context while moving between tasks.

It combines a Flask + SQLite backend with a React/Vite frontend. The UI uses a **dark slate-violet + hot magenta** design system: a persistent navigation rail, a focus-first dashboard with a 7-day activity chart, a statement-graph donut per status, focused task cards, a queue table, a reverse-chronological activity feed, and a copyable daily standup summary.

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
| Frontend | React 19, React Router 7, Vite 8 |
| Styling | Hand-written CSS design system (tokens in `:root`) |
| Typography | Inter + JetBrains Mono via Google Fonts |
| Animation | Framer Motion (toast transitions) |

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
| Dashboard | 7-day activity chart, total/active/done stats, statement-graph donuts per status, In Progress focus cards, sortable task queue |
| Task Creation | Create tasks with title, optional description, and priority |
| Task Detail | Header with badges and actions, snapshot panel, interruption logger (only when InProgress), full activity feed |
| Status Transitions | Server-enforced state machine between `ToDo`, `InProgress`, `Paused`, and `Done` |
| Context Snapshot | Capture where you left off before pausing or resuming later |
| Interruption Logger | Record unplanned interruptions while a task is in progress |
| Cognitive Load Warning | Banner appears when 3 or more tasks are `InProgress` |
| Activity Log | Tracks status changes, snapshots, and interruptions per task |
| Standup Summary | Hero progress ring + four toned sections + copy-ready plain-text report |
| Task Tree | Collapsible hierarchy of every task, grouped by status |
| Security | Audit-trail feed across all tasks, totals by event type, active session info |
| Privacy | Data retention toggles, snapshot scope toggles, JSON exports of tasks and activity |
| Preferences | Profile, workflow, and notification toggles |

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
`-- frontend/
    |-- index.html         Vite HTML shell
    |-- package.json       Frontend scripts and dependencies
    |-- vite.config.js     Vite config and API proxy
    `-- src/
        |-- main.jsx       React entry point
        |-- App.jsx        Application shell and route table
        |-- api.js         Frontend API wrapper
        |-- helpers.js     Shared formatters and status / priority metadata
        |-- index.css      Dark slate-violet + hot magenta design system
        |-- components/
        |   |-- Atoms.jsx   PageEyebrow and GraphRing primitives
        |   |-- Icons.jsx   Shared inline SVG icon component
        |   |-- Sidebar.jsx Persistent navigation rail
        |   `-- Toast.jsx   Toast notifications
        `-- pages/
            |-- TasksPage.jsx       Dashboard (chart, stats, graph, queue)
            |-- TaskDetailPage.jsx  Task detail, actions, snapshot, logs
            |-- TaskCreatePage.jsx  New task form
            |-- SnapshotPage.jsx    Context snapshot form
            |-- StandupPage.jsx     Daily standup summary
            |-- TaskTreePage.jsx    Hierarchical task view
            |-- SecurityPage.jsx    Audit trail and session info
            |-- PrivacyPage.jsx     Data retention and export controls
            `-- PreferencesPage.jsx Profile, workflow, notification settings
```

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
| `GET` | `/activity?limit=N` | Recent activity logs joined with task title/priority/status, plus totals by event type (powers the Security audit trail) |

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
| `/tree` | Task tree (grouped hierarchy) |
| `/security` | Audit trail and session info |
| `/privacy` | Retention, scope, and export controls |
| `/preferences` | Profile, workflow, and notification settings |

## Design System

The visual language was authored as a high-fidelity prototype and lifted into the React app verbatim where possible. Key tokens (all CSS custom properties at `:root` in `frontend/src/index.css`):

| Token group | Examples |
|---|---|
| Surfaces | `--bg-shell`, `--panel`, `--panel-up` |
| Text | `--t1` … `--t5` (primary → muted) |
| Brand | `--hot`, `--hot-light`, `--hot-deep`, `--hot-grad` |
| Accents | `--blue`, `--violet`, `--cyan`, `--amber`, `--danger` |
| Tracking | `--track-cap` (0.22em), `--track-cap-tight` (0.14em) |
| Density | `--d-pad`, `--d-gap`, `--d-side-w`, `--d-text-num` |

Status ring colors used by the dashboard donuts and tree pips:

| Status | Color |
|---|---|
| `ToDo` | `#6e7488` |
| `InProgress` | `#ff3a86` (hot) |
| `Paused` | `#b794ff` (violet) |
| `Done` | `#4ed9c6` (cyan) |

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

- The React frontend is the only UI; Flask serves JSON only.
- The API currently uses SQLite directly with simple route handlers, which keeps the app easy to reason about.
- The task state machine lives in `app.py` as `VALID_TRANSITIONS`.
- The visual design system lives primarily in `frontend/src/index.css`.
- Preferences and Privacy toggle state is currently local to the page (presentational). Persisting these via a new endpoint is a natural next step.
