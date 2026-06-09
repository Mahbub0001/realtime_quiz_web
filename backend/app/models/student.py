from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    university_id = Column(String, nullable=False)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("QuizSession", back_populates="students")
    responses = relationship("Response", back_populates="student", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('university_id', 'session_id', name='uq_student_university_session'),
    )
