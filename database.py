"""SQLite database setup for DevOrbit.

The backend uses a small local SQLite database instead of an ORM. This keeps
the persistence layer transparent and easy to inspect while still enforcing
foreign keys and basic domain constraints at the database level.
"""

import os
import sqlite3


DB_PATH = os.path.join(os.path.dirname(__file__), 'devorbit.db')


def get_db():
    """Open a SQLite connection configured for DevOrbit route handlers.

    Rows are returned as sqlite3.Row objects so callers can access values by
    column name before converting them to dictionaries for JSON responses.

    Tests can point the connection at a fresh database by either setting
    the ``DEVORBIT_DB_PATH`` environment variable before importing this
    module, or by monkeypatching ``database.DB_PATH`` directly.
    """
    path = os.environ.get('DEVORBIT_DB_PATH', DB_PATH)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create all required tables if they do not already exist."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            description TEXT,
            priority    TEXT    NOT NULL DEFAULT 'Medium'
                            CHECK(priority IN ('High','Medium','Low')),
            status      TEXT    NOT NULL DEFAULT 'ToDo'
                            CHECK(status IN ('ToDo','InProgress','Paused','Done')),
            created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS context_snapshots (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            content    TEXT    NOT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            event_type TEXT    NOT NULL
                           CHECK(event_type IN ('StatusChange','Interruption','Snapshot')),
            content    TEXT    NOT NULL,
            timestamp  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    ''')

    conn.commit()
    conn.close()
