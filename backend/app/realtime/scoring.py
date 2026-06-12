from typing import Dict, List, Any
import time
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from app.models.response import Response
from app.models.student import Student

class ScoringManager:
    def __init__(self):
        # session_code -> question_id -> start_time
        self.question_start_times: Dict[str, Dict[int, float]] = {}

    def start_question(self, session_code: str, question_id: int):
        if session_code not in self.question_start_times:
            self.question_start_times[session_code] = {}
        self.question_start_times[session_code][question_id] = time.time()

    def record_answer(self, db: Session, session_id: int, session_code: str, 
                      student_id: int, question_id: int, selected_option: str, 
                      is_correct: bool, time_limit: int, points_available: int):
                      
        start_time = self.question_start_times.get(session_code, {}).get(question_id)
        if not start_time:
            # If start time isn't found, maybe the server restarted or it was skipped. 
            # We'll just give 0 or minimum score. Assuming 0 for safety.
            time_taken = time_limit
            response_time_ms = time_limit * 1000
        else:
            time_taken = time.time() - start_time
            response_time_ms = int(time_taken * 1000)

        # Check time limit expiration
        # If response time exceeds time limit (plus a small buffer for network latency), mark as incorrect
        if time_taken > time_limit + 2:
            is_correct = False
            
        score = 0
        if is_correct:
            # Award full points for correct answers (no time-based penalty)
            score = points_available

        # Save to DB. The unique constraint will raise an error if student already answered,
        # which should be handled by the caller.
        new_response = Response(
            session_id=session_id,
            student_id=student_id,
            question_id=question_id,
            selected_option=selected_option,
            is_correct=is_correct,
            response_time_ms=response_time_ms,
            score_awarded=score
        )
        db.add(new_response)
        db.commit()
        db.refresh(new_response)
        
        return new_response

    def get_leaderboard(self, db: Session, session_id: int) -> List[Dict[str, Any]]:
        """
        Leaderboard ranking rules:
          1st priority: total_score (higher is better)
          2nd priority: total_response_time_ms (lower is better — answered faster)
        Ranks are always unique. If two students have the same score,
        the one who answered faster across all questions ranks higher.
        """

        results = db.query(
            Student.id.label('student_id'),
            Student.name.label('student_name'),
            Student.university_id.label('university_id'),
            func.coalesce(func.sum(Response.score_awarded), 0).label('total_score'),
            func.coalesce(func.sum(func.cast(Response.is_correct, Integer)), 0).label('correct_answers'),
            # Sum of response times for correct answers only (faster correct answers = better tiebreaker)
            func.coalesce(
                func.sum(
                    func.cast(Response.is_correct, Integer) * Response.response_time_ms
                ), 0
            ).label('total_correct_time_ms')
        ).outerjoin(Response, (Student.id == Response.student_id) & (Response.session_id == session_id)) \
         .filter(Student.session_id == session_id) \
         .group_by(Student.id) \
         .order_by(
             func.coalesce(func.sum(Response.score_awarded), 0).desc(),          # 1st: highest score
             func.coalesce(                                                        # 2nd: fastest correct answers
                 func.sum(
                     func.cast(Response.is_correct, Integer) * Response.response_time_ms
                 ), 0
             ).asc()
         ).all()

        leaderboard = []
        for rank, row in enumerate(results, start=1):
            leaderboard.append({
                "rank": rank,
                "student_id": row.student_id,
                "student_name": row.student_name,
                "university_id": row.university_id,
                "total_score": int(row.total_score),
                "correct_answers": int(row.correct_answers),
                "total_correct_time_ms": int(row.total_correct_time_ms),
            })

        return leaderboard

scoring_manager = ScoringManager()
