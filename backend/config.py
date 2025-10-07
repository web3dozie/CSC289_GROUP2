import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Secret key for session management
SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-change-in-production")

# Database URL - construct path relative to backend directory
def get_database_url():
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///taskline.db")
    if db_url.startswith("sqlite+aiosqlite:///") and not db_url.startswith("sqlite+aiosqlite:////"):
        # Relative path - make it relative to backend directory
        db_filename = db_url.replace("sqlite+aiosqlite:///", "")
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(backend_dir, db_filename)
        return f"sqlite+aiosqlite:///{db_path}"
    return db_url

DATABASE_URL = get_database_url()
