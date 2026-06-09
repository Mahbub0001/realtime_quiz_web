from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    session_code = Column(String, unique=True, index=True, nullable=False)
    join_token = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="waiting") # waiting, active, ended
    current_question_index = Column(Integer, default=-1)
    options_visible = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    quiz = relationship("Quiz", back_populates="sessions")
    teacher = relationship("Teacher")
    students = relationship("Student", back_populates="session", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="session", cascade="all, delete-orphan")
