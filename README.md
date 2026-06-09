# Real-time Quiz Platform 🚀

A Kahoot-inspired live classroom quiz platform built with **FastAPI** (backend) and **React + Vite** (frontend).

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

---

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env from example
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

# Seed the database (creates demo teacher + sample quiz)
python -m app.seed

# Start the server
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

### 2. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Demo Credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | `teacher@example.com`    |
| Password | `password123`            |

---

## Testing the Full Flow (Two Browser Windows)

1. **Window 1 (Teacher):** Go to `http://localhost:5173/login` → login → click **Host Live** on the Sample Quiz.
2. **Window 2 (Student):** Open the join URL shown on the teacher's screen in an Incognito / private window.
3. **Student:** Enter name and university ID → click **Join Game**.
4. **Teacher:** Click **Start Quiz** → **Reveal Options** → **Close & Show Results** → **Next Question** → **End Session**.

---

## Project Structure

```
realtime-quiz-platform/
├── backend/
│   ├── app/
│   │   ├── api/          # REST routes (auth, quizzes, sessions)
│   │   ├── core/         # Config, security (JWT, bcrypt)
│   │   ├── database/     # SQLAlchemy engine, session, init
│   │   ├── models/       # ORM models
│   │   ├── realtime/     # WebSocket manager, protocol, scoring
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── main.py       # FastAPI app entry point
│   │   └── seed.py       # Database seeder
│   ├── load_test_ws.py   # WS concurrency tester
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/          # Axios client, WS wrapper
│       ├── components/   # Reusable UI components
│       └── pages/        # Page-level components
└── docs/
    ├── API_CONTRACT.md
    ├── UI_WIREFRAMES.md
    ├── TESTING_GUIDE.md
    └── DEPLOYMENT.md
```

---

## Known MVP Limitations

- SQLite is single-writer — replace with PostgreSQL for production.
- WebSocket state is in-memory — a single process only. Scale with Redis Pub/Sub.
- No teacher-side question timer enforcement (server records timestamp; client shows visual only).
- No email verification for teacher registration.

---

## Load Testing

```bash
# While the server is running, with an active session:
cd backend
python load_test_ws.py <SESSION_CODE>
```
