from pydantic import BaseModel, constr, Field
from typing import Optional, List
from datetime import datetime

class QuestionBase(BaseModel):
    text: str
    shape: constr(pattern='^(circle|square|triangle|diamond)$')
    color: constr(pattern='^(red|blue|green|yellow|purple|orange)$')
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    time_limit_seconds: int = 20
    points: int = 1000
    order_index: int
    image_url: Optional[str] = None

class QuestionCreate(QuestionBase):
    correct_option: constr(pattern='^(A|B|C|D)$')

class QuestionRead(QuestionBase):
    id: int
    quiz_id: int

    class Config:
        from_attributes = True

class QuestionTeacherRead(QuestionRead):
    correct_option: str

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None

class QuizCreate(QuizBase):
    questions: List[QuestionCreate] = Field(..., min_length=1)

class QuizRead(QuizBase):
    id: int
    teacher_id: int
    created_at: datetime
    questions: List[QuestionRead]

    class Config:
        from_attributes = True

class QuizTeacherRead(QuizRead):
    questions: List[QuestionTeacherRead]
