import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Secret key for session management
SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-change-in-production")
# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///local.db")
