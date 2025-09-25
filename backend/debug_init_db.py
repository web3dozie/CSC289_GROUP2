import os
os.environ['DATABASE_URL']='sqlite+aiosqlite:///:memory:'
import asyncio
from backend.app import initialize_database

async def main():
    try:
        await initialize_database()
        print('initialize_database ok')
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
