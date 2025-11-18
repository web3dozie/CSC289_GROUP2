import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Secret key for session management
SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-change-in-production")

# Database URL - construct path relative to backend directory
def get_database_url():
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///db/taskline.db")
    if db_url.startswith("sqlite+aiosqlite:///"):
        # Extract the path part after sqlite+aiosqlite:///
        db_path_part = db_url.replace("sqlite+aiosqlite:///", "", 1)
        
        # Check if it's already an absolute path
        # Absolute paths on Unix start with / (sqlite:////path)
        # Absolute paths on Windows have drive letters like C:/path or C:\path
        if db_path_part.startswith("/") or (len(db_path_part) > 1 and db_path_part[1] == ":"):
            # Already absolute path, return as-is
            return db_url
        
        # Relative path - make it relative to backend directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(backend_dir, db_path_part)
        return f"sqlite+aiosqlite:///{db_path}"
    return db_url

DATABASE_URL = get_database_url()
