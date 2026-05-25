"""Smoke tests for the public DevOrbit API surface."""


def test_create_task_requires_title(client):
    res = client.post('/api/tasks', json={'title': '   '})
    assert res.status_code == 400


def test_task_list_returns_total(client):
    client.post('/api/tasks', json={'title': 'a'})
    client.post('/api/tasks', json={'title': 'b'})
    body = client.get('/api/tasks').get_json()
    assert body['total'] == 2
    assert len(body['tasks']) == 2


def test_task_list_pagination(client):
    for i in range(5):
        client.post('/api/tasks', json={'title': f'task {i}'})
    body = client.get('/api/tasks?limit=2&offset=0').get_json()
    assert body['limit'] == 2
    assert body['offset'] == 0
    assert body['total'] == 5
    assert len(body['tasks']) == 2


def test_dashboard_bundles_payload(client):
    client.post('/api/tasks', json={'title': 'a'})
    body = client.get('/api/dashboard').get_json()
    assert 'tasks' in body
    assert 'active_count' in body
    assert 'interrupted_today' in body
    assert 'activity' in body
    assert body['activity']['days'] == 7
    assert len(body['activity']['series']) == 7


def test_settings_defaults_then_persist(client):
    defaults = client.get('/api/settings').get_json()
    assert defaults['autoSnap'] is True

    updated = client.put('/api/settings', json={'autoSnap': False, 'name': 'Alice'}).get_json()
    assert updated['autoSnap'] is False
    assert updated['name'] == 'Alice'
    # untouched keys keep their defaults
    assert updated['cogLoad'] is True

    # round-trip
    again = client.get('/api/settings').get_json()
    assert again['autoSnap'] is False
    assert again['name'] == 'Alice'


def test_settings_reset_returns_to_defaults(client):
    client.put('/api/settings', json={'name': 'Alice'})
    after_reset = client.post('/api/settings/reset').get_json()
    assert after_reset['name'] == 'John Dennis'


def test_settings_rejects_non_object_body(client):
    res = client.put('/api/settings', json=[1, 2, 3])
    assert res.status_code == 400


def test_interruption_log_appears_in_activity(client):
    task = client.post('/api/tasks', json={'title': 't'}).get_json()
    client.patch(f'/api/tasks/{task["id"]}/status', json={'status': 'InProgress'})
    client.post(f'/api/tasks/{task["id"]}/interrupt', json={'note': 'pager'})

    body = client.get('/api/activity').get_json()
    types = {log['event_type'] for log in body['logs']}
    assert 'Interruption' in types
    assert body['totals']['interruptions'] == 1


def test_snapshot_save_logs_event(client):
    task = client.post('/api/tasks', json={'title': 't'}).get_json()
    res = client.post(
        f'/api/tasks/{task["id"]}/snapshot',
        json={'content': 'Left off mid-refactor'}
    )
    assert res.status_code == 200
    assert res.get_json()['snapshot']['content'] == 'Left off mid-refactor'

    detail = client.get(f'/api/tasks/{task["id"]}').get_json()
    assert any(log['event_type'] == 'Snapshot' for log in detail['logs'])
