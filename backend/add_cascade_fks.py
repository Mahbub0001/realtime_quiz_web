"""
Migration script to add ON DELETE CASCADE to foreign keys.
Run this to update existing PostgreSQL databases in production.
"""

from sqlalchemy import text
from app.database.db import engine


def migrate():
    with engine.connect() as conn:
        if "postgresql" not in str(engine.url):
            print("Skipping: not a PostgreSQL database (FKs are not enforced in SQLite without PRAGMA).")
            return

        trans = conn.begin()
        try:
            print("Altering foreign keys to add ON DELETE CASCADE...")

            # Response.question_id -> questions.id
            conn.execute(text("ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_question_id_fkey"))
            conn.execute(text("ALTER TABLE responses ADD CONSTRAINT responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE"))

            # Question.quiz_id -> quizzes.id
            conn.execute(text("ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_quiz_id_fkey"))
            conn.execute(text("ALTER TABLE questions ADD CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE"))

            trans.commit()
            print("Successfully added ON DELETE CASCADE to foreign keys.")

        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")
            raise

    print("Done.")


if __name__ == "__main__":
    migrate()
