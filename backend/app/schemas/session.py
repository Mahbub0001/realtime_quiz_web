from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    quiz_id: int

class SessionRead(BaseModel):
    id: int
    quiz_id: int
    teacher_id: int
    session_code: str
    join_token: str
    join_url: Optional[str] = None
    status: str
    current_question_index: int
    options_visible: bool
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentJoinRequest(BaseModel):
    name: str
    university_id: str

class PublicSessionRead(BaseModel):
    session_id: int
    quiz_title: str
    status: str
    participant_count: int

class StudentJoinResponse(BaseModel):
    student_id: int
    session_id: int
    session_code: str
    websocket_url: str

class StudentRead(BaseModel):
    id: int
    name: str
    university_id: str
    session_id: int
    joined_at: datetime

    class Config:
        from_attributes = True

class ResponseCreate(BaseModel):
    question_id: int
    selected_option: str
    response_time_ms: int

class LeaderboardEntryRead(BaseModel):
    student_id: int
    student_name: str
    university_id: str
    total_score: int
    correct_answers: int
    rank: int

class SessionHistoryEntry(BaseModel):
    session_id: int
    session_code: str
    quiz_id: int
    quiz_title: str
    status: str
    participant_count: int
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    leaderboard: List[LeaderboardEntryRead] = []

    class Config:
        from_attributes = True
