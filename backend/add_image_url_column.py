"""
Migration script to add image_url column to questions table.
Run this to update existing databases with the new image_url field.
"""

from sqlalchemy import text, inspect
from app.database.db import engine, SessionLocal, Base
from app.models.quiz import Question

def migrate():
    """Add image_url column to questions table if it doesn't exist."""
    db = SessionLocal()
    
    try:
        # Check if column already exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('questions')]
        
        if 'image_url' in columns:
            print("image_url column already exists in questions table.")
            return
        
        # Add the column
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE questions ADD COLUMN image_url TEXT"))
            conn.commit()
        
        print("Successfully added image_url column to questions table.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
