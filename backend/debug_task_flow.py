import os
import asyncio
import tempfile

# Temporary DB file
tmp_db = tempfile.NamedTemporaryFile(prefix='dbg_task_', suffix='.db', delete=False)
os.environ['DATABASE_URL'] = f"sqlite+aiosqlite:///{tmp_db.name}"

from backend.app import create_app, initialize_database

async def main():
    app = create_app()
    app.config['TESTING'] = True
    # initialize DB
    await initialize_database()
    async with app.test_client() as client:
        # create user
        resp = await client.post('/api/auth/setup', json={'pin': '1234', 'username': 'dbg'})
        print('auth status', resp.status_code, await resp.get_json())
        # create task
        resp = await client.post('/api/tasks/', json={'title': 'Debug Task'})
        print('create status', resp.status_code)
        try:
            print('create json', await resp.get_json())
        except Exception:
            print('create body', await resp.get_data())
        # attempt to fetch tasks list
        resp = await client.get('/api/tasks/')
        print('list status', resp.status_code, await resp.get_json())
        # fetch first id if present
        data = await resp.get_json()
        if data:
            tid = data[0]['id'] if 'id' in data[0] else data[0].get('task_id') or data[0].get('id')
            resp = await client.get(f'/api/tasks/{tid}')
            print('get status', resp.status_code)
            try:
                print('get json', await resp.get_json())
            except Exception:
                print('get body', await resp.get_data())
            # attempt update
            resp = await client.put(f'/api/tasks/{tid}', json={'title': 'Updated Debug Task', 'done': True})
            print('update status', resp.status_code)
            try:
                print('update json', await resp.get_json())
            except Exception:
                print('update body', await resp.get_data())

if __name__ == '__main__':
    asyncio.run(main())
