from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    selected_option = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    score_awarded = Column(Integer, default=0)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("QuizSession", back_populates="responses")
    student = relationship("Student", back_populates="responses")
    question = relationship("Question")

    __table_args__ = (
        UniqueConstraint('student_id', 'question_id', 'session_id', name='uq_response_student_question_session'),
    )
