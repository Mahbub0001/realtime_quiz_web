import asyncio
import json
from typing import Dict, List, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # session_code -> [WebSocket] (teachers)
        self.teachers: Dict[str, List[WebSocket]] = {}
        # session_code -> { participant_id: WebSocket } (students)
        self.students: Dict[str, Dict[int, WebSocket]] = {}

    async def connect_teacher(self, websocket: WebSocket, session_code: str):
        await websocket.accept()
        if session_code not in self.teachers:
            self.teachers[session_code] = []
        self.teachers[session_code].append(websocket)

    def disconnect_teacher(self, websocket: WebSocket, session_code: str):
        if session_code in self.teachers and websocket in self.teachers[session_code]:
            self.teachers[session_code].remove(websocket)
            if not self.teachers[session_code]:
                del self.teachers[session_code]

    async def connect_student(self, websocket: WebSocket, session_code: str, participant_id: int):
        await websocket.accept()
        if session_code not in self.students:
            self.students[session_code] = {}
        self.students[session_code][participant_id] = websocket

    def disconnect_student(self, session_code: str, participant_id: int):
        if session_code in self.students and participant_id in self.students[session_code]:
            del self.students[session_code][participant_id]
            if not self.students[session_code]:
                del self.students[session_code]

    async def broadcast_to_session(self, session_code: str, message: dict):
        """Send to both teachers and students in a session concurrently."""
        text_data = json.dumps(message)
        tasks = []
        if session_code in self.teachers:
            for connection in self.teachers[session_code]:
                tasks.append(connection.send_text(text_data))
        if session_code in self.students:
            for connection in self.students[session_code].values():
                tasks.append(connection.send_text(text_data))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_teacher(self, session_code: str, message: dict):
        """Send only to teachers in a session concurrently."""
        if session_code in self.teachers:
            text_data = json.dumps(message)
            tasks = [connection.send_text(text_data) for connection in self.teachers[session_code]]
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_students(self, session_code: str, message: dict):
        """Send only to students in a session concurrently."""
        if session_code in self.students:
            text_data = json.dumps(message)
            tasks = [connection.send_text(text_data) for connection in self.students[session_code].values()]
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_student(self, session_code: str, participant_id: int, message: dict):
        """Send to a specific student."""
        if session_code in self.students and participant_id in self.students[session_code]:
            await self.students[session_code][participant_id].send_text(json.dumps(message))

manager = ConnectionManager()

