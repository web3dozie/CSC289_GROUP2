#!/usr/bin/env python3
"""
Unit tests for the Momentum Task Manager API.
Goal: sanity-check the CRUD endpoints and basic validation
without needing to run a real server.
"""
import unittest
import json
import sys
import os

# Make sure Python can find app.py when running tests directly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db, Task

class TaskAPITestCase(unittest.TestCase):
    """End-to-end tests for the Task endpoints."""

    def setUp(self):
        """
        Run before every test.

        - Build a fresh Flask app (using the factory)
        - Point SQLAlchemy at an in-memory SQLite DB so tests stay isolated
        - Create a test client for making requests
        - Create tables
        """
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        """
        Run after every test.

        - Drop all tables so the next test starts clean
        """
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_home_endpoint(self):
        """Home should return the welcome payload and endpoint map."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)  # could also use response.get_json()
        self.assertEqual(data['message'], 'Welcome to Momentum Task Manager API!')
        self.assertEqual(data['version'], '1.0')
        self.assertIn('endpoints', data)

    def test_health_endpoint(self):
        """Health check returns a simple status object."""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database'], 'connected')
        self.assertIn('timestamp', data)

    def test_get_empty_tasks(self):
        """When there are no tasks, we should get an empty list."""
        response = self.client.get('/api/tasks')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(len(data), 0)
        self.assertIsInstance(data, list)

    def test_create_task_success(self):
        """Creating a valid task returns 201 and the new record."""
        task_data = {'title': 'Test Task'}
        response = self.client.post(
            '/api/tasks',
            json=task_data,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Test Task')
        self.assertFalse(data['done'])
        self.assertIn('id', data)
        self.assertIn('created_at', data)

    def test_create_task_without_title(self):
        """Missing 'title' should return a 400 with an error message."""
        response = self.client.post(
            '/api/tasks',
            json={},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'title is required')

    def test_create_task_empty_title(self):
        """Whitespace-only titles should be rejected."""
        response = self.client.post(
            '/api/tasks',
            json={'title': '   '},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'title cannot be empty')

    def test_get_tasks_after_creation(self):
        """
        After creating two tasks, we should get both back.
        They should come back newest-first.
        """
        # Create two tasks
        self.client.post('/api/tasks', json={'title': 'Task 1'})
        self.client.post('/api/tasks', json={'title': 'Task 2'})

        response = self.client.get('/api/tasks')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(len(data), 2)
        # Expect newest first. If flakiness ever appears, we could add a secondary sort.
        self.assertEqual(data[0]['title'], 'Task 2')
        self.assertEqual(data[1]['title'], 'Task 1')

    def test_get_task_by_id(self):
        """Create a task, then fetch it by its id."""
        create_response = self.client.post('/api/tasks', json={'title': 'Test Task'})
        task_id = json.loads(create_response.data)['id']

        response = self.client.get(f'/api/tasks/{task_id}')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Test Task')
        self.assertEqual(data['id'], task_id)

    def test_get_nonexistent_task(self):
        """Asking for a missing id should give a 404."""
        response = self.client.get('/api/tasks/999')
        self.assertEqual(response.status_code, 404)

    def test_update_task_title(self):
        """Update a task's title and verify the change sticks."""
        create_response = self.client.post('/api/tasks', json={'title': 'Original Title'})
        task_id = json.loads(create_response.data)['id']

        response = self.client.put(
            f'/api/tasks/{task_id}',
            json={'title': 'Updated Title'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Updated Title')
        self.assertEqual(data['id'], task_id)

    def test_update_task_done_status(self):
        """Flip the 'done' flag to True and make sure it saves."""
        create_response = self.client.post('/api/tasks', json={'title': 'Test Task'})
        task_id = json.loads(create_response.data)['id']

        response = self.client.put(
            f'/api/tasks/{task_id}',
            json={'done': True},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertTrue(data['done'])
        self.assertEqual(data['title'], 'Test Task')

    def test_delete_task(self):
        """Create → delete → confirm the record is gone."""
        create_response = self.client.post('/api/tasks', json={'title': 'Task to Delete'})
        task_id = json.loads(create_response.data)['id']

        # Delete
        response = self.client.delete(f'/api/tasks/{task_id}')
        self.assertEqual(response.status_code, 204)

        # And it's gone
        get_response = self.client.get(f'/api/tasks/{task_id}')
        self.assertEqual(get_response.status_code, 404)

    def test_delete_nonexistent_task(self):
        """Deleting a missing id should return 404."""
        response = self.client.delete('/api/tasks/999')
        self.assertEqual(response.status_code, 404)

    def test_complete_workflow(self):
        """
        Full flow:
          1) create
          2) read
          3) update
          4) delete
          5) confirm 404
        """
        # 1. Create
        create_response = self.client.post('/api/tasks', json={'title': 'Workflow Test'})
        self.assertEqual(create_response.status_code, 201)
        task_id = json.loads(create_response.data)['id']

        # 2. Read
        get_response = self.client.get(f'/api/tasks/{task_id}')
        self.assertEqual(get_response.status_code, 200)
        task_data = json.loads(get_response.data)
        self.assertEqual(task_data['title'], 'Workflow Test')
        self.assertFalse(task_data['done'])

        # 3. Update
        update_response = self.client.put(
            f'/api/tasks/{task_id}',
            json={'title': 'Updated Workflow Test', 'done': True}
        )
        self.assertEqual(update_response.status_code, 200)
        updated_data = json.loads(update_response.data)
        self.assertEqual(updated_data['title'], 'Updated Workflow Test')
        self.assertTrue(updated_data['done'])

        # 4. Delete
        delete_response = self.client.delete(f'/api/tasks/{task_id}')
        self.assertEqual(delete_response.status_code, 204)

        # 5. Verify it's gone
        final_get_response = self.client.get(f'/api/tasks/{task_id}')
        self.assertEqual(final_get_response.status_code, 404)


if __name__ == '__main__':
    # Run with -v to show each test name and result.
    unittest.main(verbosity=2)
