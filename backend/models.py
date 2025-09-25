from datetime import datetime, date
from functools import wraps
from quart import jsonify, request, session
import inspect
import hashlib

from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.db_async import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100))
    pin_hash = Column(String(128), nullable=False)
    config_data = Column(Text, default='{}')
    created_at = Column(DateTime, default=datetime.now)
    
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", cascade="all, delete-orphan")

class Status(Base):
    __tablename__ = 'statuses'
    
    id = Column(Integer, primary_key=True)
    description = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    tasks = relationship("Task", back_populates="status")

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    notes = Column(Text)
    done = Column(Boolean, default=False)
    category = Column(String(50), nullable=True)
    priority = Column(Boolean, default=False)
    due_date = Column(Date, nullable=True)
    estimate_minutes = Column(Integer, nullable=True)
    order = Column(Integer, default=0)
    status_id = Column(Integer, ForeignKey('statuses.id'), default=1)
    created_at = Column(DateTime, default=datetime.now)
    updated_on = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    closed_on = Column(DateTime)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    user = relationship("User", back_populates="tasks")
    status = relationship("Status", back_populates="tasks")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'notes': self.notes,
            'done': self.done,
            'category': self.category,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'estimate_minutes': self.estimate_minutes,
            'order': self.order,
            'created_at': self.created_at.isoformat(),
            'updated_on': self.updated_on.isoformat() if self.updated_on else None,
            'closed_on': self.closed_on.isoformat() if self.closed_on else None,
            'status': {
                'id': self.status.id,
                'name': self.status.description
            } if self.status else None,
            'created_by': self.created_by
        }

class JournalEntry(Base):
    __tablename__ = 'journal_entries'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    entry_date = Column(Date, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_on = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    user = relationship("User", back_populates="journal_entries")

    def to_dict(self):
        return {
            'id': self.id,
            'entry_date': self.entry_date.isoformat(),
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_on': self.updated_on.isoformat() if self.updated_on else None
        }

class UserSettings(Base):
    __tablename__ = 'user_settings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    notes_enabled = Column(Boolean, default=True)
    timer_enabled = Column(Boolean, default=True)
    ai_url = Column(String(500), nullable=True)
    auto_lock_minutes = Column(Integer, default=10)
    theme = Column(String(50), default='light')
    updated_on = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    user = relationship("User", back_populates="settings")

    def to_dict(self):
        return {
            'notes_enabled': self.notes_enabled,
            'timer_enabled': self.timer_enabled,
            'ai_url': self.ai_url,
            'auto_lock_minutes': self.auto_lock_minutes,
            'theme': self.theme,
            'updated_on': self.updated_on.isoformat() if self.updated_on else None
        }

def auth_required(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        if inspect.iscoroutinefunction(f):
            return await f(*args, **kwargs)
        else:
            return f(*args, **kwargs)
    return decorated_function

def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()

def validate_pin(pin: str) -> bool:
    return pin.isdigit() and 4 <= len(pin) <= 8
