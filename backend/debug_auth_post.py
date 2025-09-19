import os
import asyncio

os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///:memory:'

from app import create_app

async def main():
    app = create_app()
    app.config['TESTING'] = True
    async with app.test_client() as client:
        resp = await client.post('/api/auth/setup', json={'pin': '1234', 'username': 'dbg'})
        print('STATUS:', resp.status_code)
        try:
            j = await resp.get_json()
            print('JSON:', j)
        except Exception:
            data = await resp.get_data()
            print('BODY:', data)

if __name__ == '__main__':
    asyncio.run(main())
