"""
JalNetra - Async Database Engine
Configures SQLAlchemy async engine + session factory for PostgreSQL.
The DATABASE_URL env var is auto-converted to use asyncpg driver.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Support both postgres:// and postgresql:// URL schemes; convert to asyncpg driver
_raw_url: str = os.getenv(
    "DATABASE_URL",
    "postgresql://aquasentinel:aquasentinel_password@localhost:5432/aquasentinel_db",
)
DATABASE_URL: str = (
    _raw_url
    .replace("postgres://", "postgresql+asyncpg://", 1)
    .replace("postgresql://", "postgresql+asyncpg://", 1)
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,   # validates connections before use
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,    # recycle connections after 30 min
)

# Session factory — use async_sessionmaker (SQLAlchemy 2.0+)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=True,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


async def get_db():
    """FastAPI dependency that yields a scoped async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
