from pydantic import BaseModel
from typing import Dict, Any, Optional

class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]

# Examples of WSMessage types:
# client -> server:
# { "type": "join", "data": { "join_code": "123456", "name": "John", "university_id": "U123" } }
# { "type": "submit_answer", "data": { "option_id": 5 } }
# { "type": "teacher_command", "data": { "command": "next_question" } } # start, next_question, reveal_options, end

# server -> client:
# { "type": "lobby_update", "data": { "participants": [...] } }
# { "type": "question_start", "data": { "question_id": 1, "text": "...", "time_limit": 30, "options_count": 4 } }
# { "type": "options_revealed", "data": { "options": [{id, text}] } }
# { "type": "question_result", "data": { "correct_option_id": 5, "your_score": 100, "leaderboard": [...] } }
# { "type": "error", "data": { "message": "..." } }
