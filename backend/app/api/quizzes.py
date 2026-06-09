from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.quiz import Quiz, Question
from app.models.teacher import Teacher
from app.schemas.quiz import QuizCreate, QuizTeacherRead
from app.api.auth import get_current_teacher

router = APIRouter()

@router.post("/", response_model=QuizTeacherRead, status_code=status.HTTP_201_CREATED)
def create_quiz(quiz_in: QuizCreate, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    db_quiz = Quiz(
        title=quiz_in.title,
        description=quiz_in.description,
        teacher_id=current_teacher.id
    )
    db.add(db_quiz)
    db.flush() # flush to get db_quiz.id

    for q_in in quiz_in.questions:
        db_question = Question(
            quiz_id=db_quiz.id,
            text=q_in.text,
            shape=q_in.shape,
            color=q_in.color,
            option_a=q_in.option_a,
            option_b=q_in.option_b,
            option_c=q_in.option_c,
            option_d=q_in.option_d,
            correct_option=q_in.correct_option,
            time_limit_seconds=q_in.time_limit_seconds,
            points=q_in.points,
            order_index=q_in.order_index,
            image_url=q_in.image_url
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@router.get("/", response_model=List[QuizTeacherRead])
def get_quizzes(db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    return db.query(Quiz).filter(Quiz.teacher_id == current_teacher.id).all()

@router.get("/{quiz_id}", response_model=QuizTeacherRead)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.teacher_id == current_teacher.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz

@router.put("/{quiz_id}", response_model=QuizTeacherRead)
def update_quiz(quiz_id: int, quiz_in: QuizCreate, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.teacher_id == current_teacher.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    # Update quiz fields
    quiz.title = quiz_in.title
    quiz.description = quiz_in.description

    # Replace questions completely for MVP
    # Delete existing questions
    db.query(Question).filter(Question.quiz_id == quiz.id).delete()

    # Add new questions
    for q_in in quiz_in.questions:
        db_question = Question(
            quiz_id=quiz.id,
            text=q_in.text,
            shape=q_in.shape,
            color=q_in.color,
            option_a=q_in.option_a,
            option_b=q_in.option_b,
            option_c=q_in.option_c,
            option_d=q_in.option_d,
            correct_option=q_in.correct_option,
            time_limit_seconds=q_in.time_limit_seconds,
            points=q_in.points,
            order_index=q_in.order_index,
            image_url=q_in.image_url
        )
        db.add(db_question)

    db.commit()
    db.refresh(quiz)
    return quiz

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.teacher_id == current_teacher.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return None
