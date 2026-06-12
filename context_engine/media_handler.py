
"""
@fileOverview Backend Media Stream Handler (SQL-based Architecture)
Demonstrates handling multipart file streams and committing data to SQL.
"""

from typing import Optional, Dict
import os
import sqlite3 # Generic SQL client (can be replaced with SQLAlchemy)
from datetime import datetime

# Database Configuration
SQL_DB_PATH = "nexus_intelligence.db"

def initialize_sql_schema():
    """Sets up the initial SQL structure for mission messages and media."""
    conn = sqlite3.connect(SQL_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mission_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message_text TEXT,
            media_path TEXT,
            media_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

async def handle_mission_media(
    user_id: str, 
    message_text: str, 
    file_stream: Optional[bytes] = None, 
    file_name: Optional[str] = None
) -> Dict:
    """
    Processes incoming mission descriptions and attached media.
    Stores files in a local assets directory and logs metadata to SQL.
    """
    media_path = None
    media_type = None

    # 1. Handle File Stream (Local Storage logic)
    if file_stream and file_name:
        assets_dir = "assets/mission_media"
        os.makedirs(assets_dir, exist_ok=True)
        
        # Generate unique local filename
        unique_name = f"{datetime.now().timestamp()}_{file_name}"
        media_path = os.path.join(assets_dir, unique_name)
        
        with open(media_path, "wb") as f:
            f.write(file_stream)
        
        # Determine basic type
        media_type = "image" if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) else "document"

    # 2. Commit to SQL Database
    try:
        conn = sqlite3.connect(SQL_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO mission_messages (user_id, message_text, media_path, media_type)
            VALUES (?, ?, ?, ?)
        ''', (user_id, message_text, media_path, media_type))
        conn.commit()
        conn.close()
        
        return {
            "status": "committed",
            "message": "Mission parameters ingested",
            "sql_id": cursor.lastrowid,
            "media_synced": media_path is not None
        }
    except Exception as e:
        return {"status": "error", "reason": str(e)}

# Execute schema setup on load
initialize_sql_schema()
