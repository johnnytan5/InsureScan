"""
Database connection and query utilities using psycopg3
"""
import os
import psycopg
from psycopg.rows import dict_row
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

# Database configuration from environment
DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "dbname": os.getenv("POSTGRES_DB", "insurescan"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", ""),
}


def get_connection_string():
    """Get PostgreSQL connection string"""
    return (
        f"host={DB_CONFIG['host']} "
        f"port={DB_CONFIG['port']} "
        f"dbname={DB_CONFIG['dbname']} "
        f"user={DB_CONFIG['user']} "
        f"password={DB_CONFIG['password']}"
    )


@asynccontextmanager
async def get_db_connection():
    """
    Async context manager for database connections
    Returns dict rows by default
    """
    conn = await psycopg.AsyncConnection.connect(
        get_connection_string(),
        row_factory=dict_row
    )
    try:
        yield conn
    finally:
        await conn.close()


async def execute_query(query: str, params: tuple = None):
    """
    Execute a query and return all rows as dicts
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            return await cur.fetchall()


async def execute_query_one(query: str, params: tuple = None):
    """
    Execute a query and return one row as dict
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            return await cur.fetchone()


async def execute_update(query: str, params: tuple = None):
    """
    Execute an update/insert/delete and return affected rows
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            await conn.commit()
            return cur.rowcount


async def execute_insert_returning(query: str, params: tuple = None):
    """
    Execute an insert and return the inserted row
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            await conn.commit()
            return await cur.fetchone()
