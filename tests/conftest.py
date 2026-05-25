"""Shared pytest fixtures for the DevOrbit backend test suite.

Each test gets a fresh, isolated SQLite database via a tempfile and a
Flask test client. The ``DEVORBIT_DB_PATH`` env var is set before
importing the app so route handlers read from the temp DB.
"""
import os
import sys
import tempfile

import pytest


# Make the project root importable so tests can `import app` etc.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


@pytest.fixture
def client():
    """Yield a Flask test client backed by an isolated SQLite file."""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    os.environ['DEVORBIT_DB_PATH'] = path

    # Import lazily so the env var is set first.
    import database
    import app as app_module

    database.DB_PATH = path
    database.init_db()

    app_module.app.config['TESTING'] = True
    with app_module.app.test_client() as c:
        yield c

    try:
        os.unlink(path)
    except OSError:
        pass
    os.environ.pop('DEVORBIT_DB_PATH', None)
