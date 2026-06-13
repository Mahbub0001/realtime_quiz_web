from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt
import json

from app.database.db import get_db
from app.realtime.manager import manager
from app.realtime.scoring import scoring_manager
from app.models.session import QuizSession
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.quiz import Question
from app.core.config import settings

router = APIRouter()

async def get_teacher_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        teacher_id: str = payload.get("sub")
        if teacher_id is None:
            return None
    except JWTError:
        return None
    return db.query(Teacher).filter(Teacher.id == int(teacher_id)).first()

@router.websocket("/ws/session/{session_code}/teacher")
async def teacher_websocket(websocket: WebSocket, session_code: str, token: str = Query(...), db: Session = Depends(get_db)):
    teacher = await get_teacher_from_token(token, db)
    if not teacher:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
    if not session_db or session_db.teacher_id != teacher.id:
        await websocket.close(code=4004, reason="Session not found or forbidden")
        return

    await manager.connect_teacher(websocket, session_code)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "next_question":
                # Find the next question. If current_question_index is -1, next is 0.
                next_index = session_db.current_question_index + 1
                questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
                
                if next_index < len(questions):
                    question = questions[next_index]
                    session_db.current_question_index = next_index
                    session_db.options_visible = True
                    db.commit()

                    scoring_manager.start_question(session_code, question.id)

                    # Student payload
                    student_q = {
                        "type": "question_started",
                        "question": {
                            "question_id": question.id,
                            "text": question.text,
                            "shape": question.shape,
                            "color": question.color,
                            "time_limit_seconds": question.time_limit_seconds,
                            "points": question.points,
                            "order_index": question.order_index,
                            "image_url": question.image_url,
                            "options_visible": True,
                            "options": {
                                "A": question.option_a,
                                "B": question.option_b,
                                "C": question.option_c,
                                "D": question.option_d
                            }
                        }
                    }
                    await manager.send_to_students(session_code, student_q)

                    # Teacher payload
                    teacher_q = {
                        "type": "teacher_question_started",
                        "question": {
                            "question_id": question.id,
                            "text": question.text,
                            "shape": question.shape,
                            "color": question.color,
                            "option_a": question.option_a,
                            "option_b": question.option_b,
                            "option_c": question.option_c,
                            "option_d": question.option_d,
                            "correct_option": question.correct_option,
                            "time_limit_seconds": question.time_limit_seconds,
                            "image_url": question.image_url
                        }
                    }
                    await websocket.send_text(json.dumps(teacher_q))
                
            elif msg_type == "reveal_options":
                session_db.options_visible = True
                db.commit()
                
                questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
                if 0 <= session_db.current_question_index < len(questions):
                    question = questions[session_db.current_question_index]
                    opts_msg = {
                        "type": "options_revealed",
                        "question_id": question.id,
                        "options": {
                            "A": question.option_a,
                            "B": question.option_b,
                            "C": question.option_c,
                            "D": question.option_d
                        }
                    }
                    await manager.send_to_students(session_code, opts_msg)

            elif msg_type == "show_results":
                questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
                if 0 <= session_db.current_question_index < len(questions):
                    question = questions[session_db.current_question_index]
                    leaderboard = scoring_manager.get_leaderboard(db, session_db.id)
                    
                    has_next = session_db.current_question_index + 1 < len(questions)

                    results_msg = {
                        "type": "results_revealed",
                        "question_id": question.id,
                        "correct_option": question.correct_option,
                        "leaderboard": leaderboard,
                        "has_next": has_next
                    }
                    await manager.broadcast_to_session(session_code, results_msg)

            elif msg_type == "end_session":
                session_db.status = "ended"
                db.commit()
                leaderboard = scoring_manager.get_leaderboard(db, session_db.id)
                end_msg = {
                    "type": "session_ended",
                    "leaderboard": leaderboard
                }
                await manager.broadcast_to_session(session_code, end_msg)

    except WebSocketDisconnect:
        manager.disconnect_teacher(websocket, session_code)
    except Exception as e:
        print(f"Teacher WS Error: {e}")
        manager.disconnect_teacher(websocket, session_code)


@router.websocket("/ws/session/{session_code}/student/{student_id}")
async def student_websocket(websocket: WebSocket, session_code: str, student_id: int, db: Session = Depends(get_db)):
    session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
    student = db.query(Student).filter(Student.id == student_id, Student.session_id == session_db.id if session_db else False).first()

    if not session_db or not student:
        await websocket.close(code=4004, reason="Not found")
        return

    await manager.connect_student(websocket, session_code, student_id)
    
    # Broadcast participant update
    participant_count = db.query(Student).filter(Student.session_id == session_db.id).count()
    await manager.broadcast_to_session(session_code, {
        "type": "participant_update",
        "participant_count": participant_count
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "submit_answer":
                # Validate active session
                db.refresh(session_db)
                if session_db.status != "active":
                    continue
                
                # Validate options are visible
                if not session_db.options_visible:
                    continue

                q_id = message.get("question_id")
                selected_opt = message.get("selected_option")
                
                questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
                if 0 <= session_db.current_question_index < len(questions):
                    question = questions[session_db.current_question_index]
                    
                    if question.id == q_id:
                        is_correct = (selected_opt == question.correct_option)
                        try:
                            # Record answer
                            scoring_manager.record_answer(
                                db=db, 
                                session_id=session_db.id, 
                                session_code=session_code,
                                student_id=student_id, 
                                question_id=q_id, 
                                selected_option=selected_opt, 
                                is_correct=is_correct, 
                                time_limit=question.time_limit_seconds, 
                                points_available=question.points
                            )
                            
                            # Confirm to student
                            await websocket.send_text(json.dumps({"type": "answer_received"}))
                            
                            # Send leaderboard update only to the teacher to save bandwidth and CPU
                            # Students do not render the leaderboard during the answer phase.
                            leaderboard = scoring_manager.get_leaderboard(db, session_db.id)
                            update_msg = {
                                "type": "leaderboard_update",
                                "leaderboard": leaderboard
                            }
                            await manager.send_to_teacher(session_code, update_msg)
                            
                        except IntegrityError:
                            db.rollback()
                            # Duplicate answer
                            pass
                            
    except WebSocketDisconnect:
        manager.disconnect_student(session_code, student_id)
        # Optional: broadcast participant count down
    except Exception as e:
        print(f"Student WS Error: {e}")
        manager.disconnect_student(session_code, student_id)
