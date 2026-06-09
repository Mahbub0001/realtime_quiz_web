import uuid
import random
import string
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.session import QuizSession
from app.models.quiz import Quiz
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.session import (
    SessionCreate, SessionRead, 
    StudentJoinRequest, PublicSessionRead, StudentJoinResponse
)
from app.api.auth import get_current_teacher
from app.realtime.manager import manager
from app.core.config import settings

router = APIRouter()

def generate_session_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_join_token():
    return secrets.token_urlsafe(16)


# ── Public student routes first (avoid FastAPI matching "join" as a session_id) ──

@router.get("/join/{join_token}", response_model=PublicSessionRead)
def get_public_session_info(join_token: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.join_token == join_token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid join token")
    if session.status == "ended":
        raise HTTPException(status_code=400, detail="This session has already ended")
    
    participant_count = db.query(Student).filter(Student.session_id == session.id).count()
    
    return PublicSessionRead(
        session_id=session.id,
        quiz_title=session.quiz.title,
        status=session.status,
        participant_count=participant_count
    )

@router.post("/join/{join_token}", response_model=StudentJoinResponse)
def join_session(join_token: str, join_req: StudentJoinRequest, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.join_token == join_token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid join token")
    
    if session.status == "ended":
        raise HTTPException(status_code=400, detail="Session has ended")

    # Check for duplicate university_id within this session
    existing_student = db.query(Student).filter(
        Student.session_id == session.id,
        Student.university_id == join_req.university_id
    ).first()

    if existing_student:
        raise HTTPException(status_code=400, detail="University ID already registered in this session")

    new_student = Student(
        name=join_req.name,
        university_id=join_req.university_id,
        session_id=session.id
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Determine WebSocket protocol based on BACKEND_PUBLIC_URL
    ws_protocol = "wss" if settings.BACKEND_PUBLIC_URL.startswith("https") else "ws"
    # Extract host and port from BACKEND_PUBLIC_URL (remove protocol)
    backend_host = settings.BACKEND_PUBLIC_URL.split("://")[-1]
    
    ws_url = f"{ws_protocol}://{backend_host}/ws/session/{session.session_code}/student/{new_student.id}"

    return StudentJoinResponse(
        student_id=new_student.id,
        session_id=session.id,
        session_code=session.session_code,
        websocket_url=ws_url
    )


# ── Protected teacher routes ──

@router.post("/", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(session_in: SessionCreate, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == session_in.quiz_id, Quiz.teacher_id == current_teacher.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    # Generate unique session code
    while True:
        code = generate_session_code()
        if not db.query(QuizSession).filter(QuizSession.session_code == code).first():
            break
            
    # Generate unique join token
    while True:
        token = generate_join_token()
        if not db.query(QuizSession).filter(QuizSession.join_token == token).first():
            break

    db_session = QuizSession(
        quiz_id=quiz.id, 
        teacher_id=current_teacher.id,
        session_code=code, 
        join_token=token,
        status="waiting"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    session_data = SessionRead.model_validate(db_session)
    session_data.join_url = f"{settings.FRONTEND_URL}/join/{token}"
    return session_data

@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.teacher_id == current_teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = SessionRead.model_validate(session)
    session_data.join_url = f"{settings.FRONTEND_URL}/join/{session.join_token}"
    return session_data

@router.post("/{session_id}/rotate-link", response_model=SessionRead)
def rotate_link(session_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.teacher_id == current_teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    while True:
        token = generate_join_token()
        if not db.query(QuizSession).filter(QuizSession.join_token == token).first():
            break

    session.join_token = token
    db.commit()
    db.refresh(session)
    
    session_data = SessionRead.model_validate(session)
    session_data.join_url = f"{settings.FRONTEND_URL}/join/{token}"
    return session_data

@router.post("/{session_id}/start", response_model=SessionRead)
def start_session(session_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.teacher_id == current_teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "waiting":
        raise HTTPException(status_code=400, detail="Only waiting sessions can be started")

    session.status = "active"
    session.started_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    
    session_data = SessionRead.model_validate(session)
    session_data.join_url = f"{settings.FRONTEND_URL}/join/{session.join_token}"
    return session_data

@router.post("/{session_id}/end", response_model=SessionRead)
async def end_session(session_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.teacher_id == current_teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == "ended":
        raise HTTPException(status_code=400, detail="Session already ended")

    session.status = "ended"
    session.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    await manager.broadcast_to_session(session.session_code, {"type": "session_ended", "leaderboard": []})
    
    session_data = SessionRead.model_validate(session)
    session_data.join_url = f"{settings.FRONTEND_URL}/join/{session.join_token}"
    return session_data

@router.get("/{session_id}/leaderboard")
def get_session_leaderboard(session_id: int, db: Session = Depends(get_db), current_teacher: Teacher = Depends(get_current_teacher)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.teacher_id == current_teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    from app.realtime.scoring import scoring_manager
    leaderboard = scoring_manager.get_leaderboard(db, session.id)
    return leaderboard
