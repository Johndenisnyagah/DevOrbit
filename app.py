"""Flask API for DevOrbit.

This module exposes the JSON API consumed by the React frontend. It owns the
task workflow state machine, cognitive-load metadata, context snapshots,
interruption logging, and daily standup aggregation.
"""

from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_db, init_db

app = Flask(__name__)
CORS(app)

# Number of active tasks at which the UI should warn about cognitive load.
COGNITIVE_LOAD_THRESHOLD = 3

# Allowed task status transitions. Keeping this map server-side ensures every
# client follows the same workflow rules.
VALID_TRANSITIONS = {
    'ToDo': ['InProgress'],
    'InProgress': ['Paused', 'Done'],
    'Paused': ['InProgress', 'Done'],
    'Done': []
}


def get_active_count():
    """Return the number of tasks currently marked as in progress."""
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) as cnt FROM tasks WHERE status = 'InProgress'"
    ).fetchone()['cnt']
    conn.close()
    return count


def log_event(task_id, event_type, content, conn=None):
    """Append an activity log entry for a task.

    When a connection is provided, the caller controls the surrounding
    transaction. Otherwise, this helper opens, commits, and closes its own
    connection for one-off log writes.
    """
    close_after = False
    if conn is None:
        conn = get_db()
        close_after = True

    conn.execute(
        "INSERT INTO activity_logs (task_id, event_type, content) VALUES (?, ?, ?)",
        (task_id, event_type, content)
    )

    if close_after:
        conn.commit()
        conn.close()


def row_to_dict(row):
    """Convert a SQLite row object into a plain dictionary for JSON responses."""
    return dict(row) if row else None


# Task endpoints

@app.route('/api/tasks', methods=['GET'])
def task_list():
    """List tasks and return dashboard metadata.

    Query parameters:
        sort: One of updated_at, priority, status, or title.
        status: Optional status filter. Use "all" for no backend filter.
    """
    sort_by = request.args.get('sort', 'updated_at')
    filter_stat = request.args.get('status', 'all')

    conn = get_db()
    query = "SELECT * FROM tasks"
    params = []

    if filter_stat != 'all':
        query += " WHERE status = ?"
        params.append(filter_stat)

    order_map = {
        'priority': "CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END",
        'status': "CASE status WHEN 'InProgress' THEN 1 WHEN 'Paused' THEN 2 WHEN 'ToDo' THEN 3 ELSE 4 END",
        'updated_at': "updated_at DESC",
        'title': "title ASC"
    }
    query += f" ORDER BY {order_map.get(sort_by, 'updated_at DESC')}"

    tasks = [row_to_dict(r) for r in conn.execute(query, params).fetchall()]
    active_count = get_active_count()
    conn.close()

    return jsonify({
        'tasks': tasks,
        'active_count': active_count,
        'show_warning': active_count >= COGNITIVE_LOAD_THRESHOLD,
        'threshold': COGNITIVE_LOAD_THRESHOLD,
    })


@app.route('/api/tasks', methods=['POST'])
def task_create():
    """Create a task and record its initial activity log entry."""
    data = request.get_json()
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    priority = data.get('priority', 'Medium')

    if not title:
        return jsonify({'error': 'Task title is required.'}), 400

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO tasks (title, description, priority) VALUES (?, ?, ?)",
        (title, description, priority)
    )
    task_id = cursor.lastrowid
    log_event(task_id, 'StatusChange', 'Task created with status: ToDo', conn)
    conn.commit()

    task = row_to_dict(conn.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone())
    conn.close()

    return jsonify(task), 201


@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def task_detail(task_id):
    """Return a task with its activity history and latest context snapshot."""
    conn = get_db()
    task = row_to_dict(conn.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone())

    if not task:
        conn.close()
        return jsonify({'error': 'Task not found.'}), 404

    logs = [row_to_dict(r) for r in conn.execute(
        "SELECT * FROM activity_logs WHERE task_id = ? ORDER BY timestamp DESC",
        (task_id,)
    ).fetchall()]
    snapshot = row_to_dict(conn.execute(
        "SELECT * FROM context_snapshots WHERE task_id = ? ORDER BY created_at DESC LIMIT 1",
        (task_id,)
    ).fetchone())
    conn.close()

    return jsonify({
        'task': task,
        'logs': logs,
        'snapshot': snapshot,
        'valid_next': VALID_TRANSITIONS.get(task['status'], [])
    })


@app.route('/api/tasks/<int:task_id>/status', methods=['PATCH'])
def update_status(task_id):
    """Move a task through the validated workflow state machine."""
    data = request.get_json()
    new_status = data.get('status')
    conn = get_db()
    task = row_to_dict(conn.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone())

    if not task:
        conn.close()
        return jsonify({'error': 'Task not found.'}), 404

    if new_status not in VALID_TRANSITIONS.get(task['status'], []):
        conn.close()
        return jsonify({'error': f'Invalid transition from {task["status"]} to {new_status}.'}), 400

    conn.execute(
        "UPDATE tasks SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?",
        (new_status, task_id)
    )
    log_event(task_id, 'StatusChange', f'Status changed to: {new_status}', conn)
    conn.commit()

    task = row_to_dict(conn.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone())
    conn.close()

    return jsonify({'task': task, 'redirect_snapshot': new_status == 'Paused'})


@app.route('/api/tasks/<int:task_id>/snapshot', methods=['POST'])
def save_snapshot(task_id):
    """Save a context snapshot for a task.

    Empty snapshot submissions are accepted as a deliberate "skip" action and
    return a null snapshot without writing a log entry.
    """
    data = request.get_json()
    content = (data.get('content') or '').strip()

    conn = get_db()
    task = row_to_dict(conn.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone())

    if not task:
        conn.close()
        return jsonify({'error': 'Task not found.'}), 404

    if content:
        conn.execute(
            "INSERT INTO context_snapshots (task_id, content) VALUES (?, ?)",
            (task_id, content)
        )
        log_event(task_id, 'Snapshot', f'Context snapshot saved: {content}', conn)
        conn.commit()
        snapshot = row_to_dict(conn.execute(
            "SELECT * FROM context_snapshots WHERE task_id = ? ORDER BY created_at DESC LIMIT 1",
            (task_id,)
        ).fetchone())
    else:
        snapshot = None

    conn.close()
    return jsonify({'snapshot': snapshot})


@app.route('/api/tasks/<int:task_id>/interrupt', methods=['POST'])
def log_interruption(task_id):
    """Record an interruption note for a task."""
    data = request.get_json()
    note = (data.get('note') or '').strip()

    if note:
        log_event(task_id, 'Interruption', note)

    return jsonify({'ok': True})


# Activity endpoints

@app.route('/api/activity', methods=['GET'])
def activity():
    """Return recent activity logs joined with their task metadata.

    Powers the Security page audit trail. Each log entry is enriched with
    the task title, priority, and current status so the audit feed can be
    rendered without N+1 calls from the frontend.
    """
    try:
        limit = max(1, min(int(request.args.get('limit', 100)), 500))
    except (TypeError, ValueError):
        limit = 100

    conn = get_db()
    rows = conn.execute(
        """SELECT al.id, al.task_id, al.event_type, al.content, al.timestamp,
                  t.title AS task_title, t.priority AS task_priority, t.status AS task_status
           FROM activity_logs al
           JOIN tasks t ON t.id = al.task_id
           ORDER BY al.timestamp DESC, al.id DESC
           LIMIT ?""",
        (limit,)
    ).fetchall()
    logs = [row_to_dict(r) for r in rows]

    totals = conn.execute(
        """SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN event_type = 'StatusChange' THEN 1 ELSE 0 END) AS status_changes,
             SUM(CASE WHEN event_type = 'Snapshot'     THEN 1 ELSE 0 END) AS snapshots,
             SUM(CASE WHEN event_type = 'Interruption' THEN 1 ELSE 0 END) AS interruptions
           FROM activity_logs"""
    ).fetchone()
    conn.close()

    return jsonify({
        'logs': logs,
        'totals': {
            'total':          totals['total']          or 0,
            'status_changes': totals['status_changes'] or 0,
            'snapshots':      totals['snapshots']      or 0,
            'interruptions':  totals['interruptions']  or 0,
        }
    })


# Standup endpoints

@app.route('/api/standup', methods=['GET'])
def standup():
    """Build the daily standup summary from task state and today's logs."""
    conn = get_db()
    today = datetime.now().strftime('%Y-%m-%d')

    completed = [row_to_dict(r) for r in conn.execute(
        "SELECT * FROM tasks WHERE status = 'Done' AND DATE(updated_at) = ?",
        (today,)
    ).fetchall()]
    in_progress = [row_to_dict(r) for r in conn.execute(
        "SELECT * FROM tasks WHERE status = 'InProgress'"
    ).fetchall()]
    paused = [row_to_dict(r) for r in conn.execute(
        "SELECT * FROM tasks WHERE status = 'Paused'"
    ).fetchall()]
    interrupted = [row_to_dict(r) for r in conn.execute(
        """SELECT DISTINCT t.* FROM tasks t
           JOIN activity_logs al ON al.task_id = t.id
           WHERE al.event_type = 'Interruption'
           AND DATE(al.timestamp) = ?
           AND t.status != 'Done'""",
        (today,)
    ).fetchall()]
    conn.close()

    return jsonify({
        'today': today,
        'completed': completed,
        'in_progress': in_progress,
        'paused': paused,
        'interrupted': interrupted,
    })


if __name__ == '__main__':
    init_db()
    print("\n  DevOrbit API running at http://127.0.0.1:5000\n")
    app.run(debug=True)
