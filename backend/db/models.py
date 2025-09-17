from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(99), nullable=False, unique=True)
    user_pin: Mapped[int] = mapped_column(nullable=False)
    # config_id: Mapped[int] = mapped_column(ForeignKey("configuration.id"), nullable=False)
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Task(Base):
    __tablename__ = "task"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(String(140))
    notes: Mapped[str] = mapped_column(String(140))
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)
    status_id: Mapped[int] = mapped_column(ForeignKey("status.id"), nullable=False)
    closed_on: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    user: Mapped["User"] = relationship(
        back_populates="tasks", cascade="all, delete orphan"
    )


class Category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(String(140))
    color_hex: Mapped[str] = mapped_column(String(6))
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
