from app.database.db import SessionLocal
from app.models.response import Response
from app.models.quiz import Question
from app.models.session import QuizSession
from app.models.student import Student
from app.models.teacher import Teacher

db = SessionLocal()
try:
    responses = db.query(Response).all()
    print(f"Total Responses: {len(responses)}")
    for r in responses:
        q = db.query(Question).filter(Question.id == r.question_id).first()
        print(f"Response ID: {r.id}, Student ID: {r.student_id}, Question ID: {r.question_id}, Question Points: {q.points if q else 'N/A'}, Score Awarded: {r.score_awarded}")
finally:
    db.close()
