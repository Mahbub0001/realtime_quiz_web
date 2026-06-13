from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt
import json
import asyncio
from fastapi.concurrency import run_in_threadpool

from app.database.db import get_db, SessionLocal
from app.realtime.manager import manager
from app.realtime.scoring import scoring_manager
from app.models.session import QuizSession
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.quiz import Question
from app.core.config import settings

router = APIRouter()

def get_teacher_from_token_sync(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        teacher_id = payload.get("sub")
        if teacher_id is None:
            return None
    except JWTError:
        return None
    with SessionLocal() as db:
        teacher = db.query(Teacher).filter(Teacher.id == int(teacher_id)).first()
        return teacher.id if teacher else None

def get_session_for_teacher(session_code: str, teacher_id: int):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db or session_db.teacher_id != teacher_id:
            return None
        return session_db.id

def teacher_next_question_sync(session_code: str):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db: return None
        next_index = session_db.current_question_index + 1
        questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
        if next_index < len(questions):
            question = questions[next_index]
            session_db.current_question_index = next_index
            session_db.options_visible = True
            
            # Extract attributes before commit to prevent DetachedInstanceError
            q_dict = {
                "id": question.id, "text": question.text, "shape": question.shape,
                "color": question.color, "time_limit_seconds": question.time_limit_seconds,
                "points": question.points, "order_index": question.order_index,
                "image_url": question.image_url, "option_a": question.option_a,
                "option_b": question.option_b, "option_c": question.option_c,
                "option_d": question.option_d, "correct_option": question.correct_option
            }
            db.commit()
            return q_dict
        return None

def teacher_reveal_options_sync(session_code: str):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db: return None
        session_db.options_visible = True
        
        questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
        q_dict = None
        if 0 <= session_db.current_question_index < len(questions):
            question = questions[session_db.current_question_index]
            q_dict = {
                "id": question.id,
                "option_a": question.option_a, "option_b": question.option_b,
                "option_c": question.option_c, "option_d": question.option_d
            }
        db.commit()
        return q_dict

def teacher_show_results_sync(session_code: str):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db: return None, None, False
        questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
        if 0 <= session_db.current_question_index < len(questions):
            question = questions[session_db.current_question_index]
            q_dict = {"id": question.id, "correct_option": question.correct_option}
            leaderboard = scoring_manager.get_leaderboard(db, session_db.id)
            has_next = session_db.current_question_index + 1 < len(questions)
            return q_dict, leaderboard, has_next
        return None, None, False

def teacher_end_session_sync(session_code: str):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db: return None
        session_db.status = "ended"
        db.commit()
        return scoring_manager.get_leaderboard(db, session_db.id)

@router.websocket("/ws/session/{session_code}/teacher")
async def teacher_websocket(websocket: WebSocket, session_code: str, token: str = Query(...)):
    teacher_id = await run_in_threadpool(get_teacher_from_token_sync, token)
    if not teacher_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    session_id = await run_in_threadpool(get_session_for_teacher, session_code, teacher_id)
    if not session_id:
        await websocket.close(code=4004, reason="Session not found or forbidden")
        return

    await manager.connect_teacher(websocket, session_code)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "next_question":
                question = await run_in_threadpool(teacher_next_question_sync, session_code)
                if question:
                    scoring_manager.start_question(session_code, question["id"])
                    student_q = {
                        "type": "question_started",
                        "question": {
                            "question_id": question["id"], "text": question["text"], "shape": question["shape"],
                            "color": question["color"], "time_limit_seconds": question["time_limit_seconds"],
                            "points": question["points"], "order_index": question["order_index"],
                            "image_url": question["image_url"], "options_visible": True,
                            "options": {"A": question["option_a"], "B": question["option_b"], "C": question["option_c"], "D": question["option_d"]}
                        }
                    }
                    await manager.send_to_students(session_code, student_q)
                    teacher_q = {
                        "type": "teacher_question_started",
                        "question": {
                            "question_id": question["id"], "text": question["text"], "shape": question["shape"],
                            "color": question["color"], "option_a": question["option_a"], "option_b": question["option_b"],
                            "option_c": question["option_c"], "option_d": question["option_d"],
                            "correct_option": question["correct_option"], "time_limit_seconds": question["time_limit_seconds"],
                            "image_url": question["image_url"]
                        }
                    }
                    await websocket.send_text(json.dumps(teacher_q))
                
            elif msg_type == "reveal_options":
                question = await run_in_threadpool(teacher_reveal_options_sync, session_code)
                if question:
                    opts_msg = {
                        "type": "options_revealed",
                        "question_id": question["id"],
                        "options": {"A": question["option_a"], "B": question["option_b"], "C": question["option_c"], "D": question["option_d"]}
                    }
                    await manager.send_to_students(session_code, opts_msg)

            elif msg_type == "show_results":
                question, leaderboard, has_next = await run_in_threadpool(teacher_show_results_sync, session_code)
                if question:
                    results_msg = {
                        "type": "results_revealed", "question_id": question["id"], "correct_option": question["correct_option"],
                        "leaderboard": leaderboard, "has_next": has_next
                    }
                    await manager.broadcast_to_session(session_code, results_msg)

            elif msg_type == "end_session":
                leaderboard = await run_in_threadpool(teacher_end_session_sync, session_code)
                if leaderboard is not None:
                    end_msg = {"type": "session_ended", "leaderboard": leaderboard}
                    await manager.broadcast_to_session(session_code, end_msg)

    except WebSocketDisconnect:
        manager.disconnect_teacher(websocket, session_code)
    except Exception as e:
        print(f"Teacher WS Error: {e}")
        manager.disconnect_teacher(websocket, session_code)


def get_student_session_data(session_code: str, student_id: int):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db: return None, 0
        student = db.query(Student).filter(Student.id == student_id, Student.session_id == session_db.id).first()
        if not student: return None, 0
        count = db.query(Student).filter(Student.session_id == session_db.id).count()
        return session_db.id, count

def submit_answer_sync(session_code: str, student_id: int, q_id: int, selected_opt: str):
    with SessionLocal() as db:
        session_db = db.query(QuizSession).filter(QuizSession.session_code == session_code).first()
        if not session_db or session_db.status != "active" or not session_db.options_visible:
            return False, None
        questions = db.query(Question).filter(Question.quiz_id == session_db.quiz_id).order_by(Question.order_index.asc()).all()
        if 0 <= session_db.current_question_index < len(questions):
            question = questions[session_db.current_question_index]
            if question.id == q_id:
                is_correct = (selected_opt == question.correct_option)
                try:
                    scoring_manager.record_answer(
                        db=db, session_id=session_db.id, session_code=session_code,
                        student_id=student_id, question_id=q_id, selected_option=selected_opt,
                        is_correct=is_correct, time_limit=question.time_limit_seconds, points_available=question.points
                    )
                    return True, scoring_manager.get_leaderboard(db, session_db.id)
                except IntegrityError:
                    db.rollback()
                    return False, None
        return False, None

@router.websocket("/ws/session/{session_code}/student/{student_id}")
async def student_websocket(websocket: WebSocket, session_code: str, student_id: int):
    session_id, participant_count = await run_in_threadpool(get_student_session_data, session_code, student_id)
    if not session_id:
        await websocket.close(code=4004, reason="Not found")
        return

    await manager.connect_student(websocket, session_code, student_id)
    await manager.broadcast_to_session(session_code, {"type": "participant_update", "participant_count": participant_count})

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "submit_answer":
                q_id = message.get("question_id")
                selected_opt = message.get("selected_option")
                
                success, leaderboard = await run_in_threadpool(submit_answer_sync, session_code, student_id, q_id, selected_opt)
                if success:
                    await websocket.send_text(json.dumps({"type": "answer_received"}))
                    await manager.send_to_teacher(session_code, {"type": "leaderboard_update", "leaderboard": leaderboard})
                            
    except WebSocketDisconnect:
        manager.disconnect_student(session_code, student_id)
    except Exception as e:
        print(f"Student WS Error: {e}")
        manager.disconnect_student(session_code, student_id)
