"""Tests for the task workflow state machine.

The transitions in VALID_TRANSITIONS are the most load-bearing rules in
DevOrbit: the entire UI assumes only those moves are allowed. These
tests pin every legal move and a sample of illegal ones.
"""


def _create(client, title='T', priority='Medium'):
    res = client.post('/api/tasks', json={'title': title, 'priority': priority})
    return res.get_json()


def _patch(client, task_id, status):
    return client.patch(f'/api/tasks/{task_id}/status', json={'status': status})


def test_todo_can_only_move_to_inprogress(client):
    task = _create(client)
    assert _patch(client, task['id'], 'Done').status_code == 400
    assert _patch(client, task['id'], 'Paused').status_code == 400
    assert _patch(client, task['id'], 'InProgress').status_code == 200


def test_inprogress_can_pause_or_finish(client):
    task = _create(client)
    _patch(client, task['id'], 'InProgress')
    assert _patch(client, task['id'], 'Done').status_code == 200

    task2 = _create(client, title='T2')
    _patch(client, task2['id'], 'InProgress')
    assert _patch(client, task2['id'], 'Paused').status_code == 200


def test_paused_can_resume_or_finish(client):
    task = _create(client)
    _patch(client, task['id'], 'InProgress')
    _patch(client, task['id'], 'Paused')
    assert _patch(client, task['id'], 'InProgress').status_code == 200

    task2 = _create(client, title='T2')
    _patch(client, task2['id'], 'InProgress')
    _patch(client, task2['id'], 'Paused')
    assert _patch(client, task2['id'], 'Done').status_code == 200


def test_done_is_terminal(client):
    task = _create(client)
    _patch(client, task['id'], 'InProgress')
    _patch(client, task['id'], 'Done')
    for next_status in ('ToDo', 'InProgress', 'Paused', 'Done'):
        res = _patch(client, task['id'], next_status)
        assert res.status_code == 400, f"Done should reject {next_status}"


def test_pause_triggers_snapshot_redirect(client):
    task = _create(client)
    _patch(client, task['id'], 'InProgress')
    res = _patch(client, task['id'], 'Paused')
    body = res.get_json()
    assert body['redirect_snapshot'] is True


def test_status_change_appends_activity_log(client):
    task = _create(client)
    _patch(client, task['id'], 'InProgress')
    detail = client.get(f'/api/tasks/{task["id"]}').get_json()
    types = [log['event_type'] for log in detail['logs']]
    assert types.count('StatusChange') >= 2  # creation + the transition
