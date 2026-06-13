import asyncio
import httpx
import websockets
import json
import random
import uuid
import sys

BASE_URL = "https://realtime-quiz-web.onrender.com"
WS_URL = "wss://realtime-quiz-web.onrender.com"

async def register_teacher(client):
    email = f"loadtest_{uuid.uuid4().hex[:8]}@example.com"
    password = "password"
    print(f"Registering teacher: {email}")
    try:
        r = await client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Load Test Teacher",
            "email": email,
            "password": password
        }, timeout=60.0)
        r.raise_for_status()
        
        r2 = await client.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        }, timeout=60.0)
        r2.raise_for_status()
        token = r2.json()["access_token"]
        return token
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def create_quiz_and_session(client, token):
    client.headers.update({"Authorization": f"Bearer {token}"})
    print("Creating quiz...")
    try:
        r = await client.post(f"{BASE_URL}/api/quizzes/", json={
            "title": "Load Test 50 Bots",
            "questions": [
                {
                    "text": "What is 2+2?",
                    "shape": "square",
                    "color": "blue",
                    "option_a": "3",
                    "option_b": "4",
                    "option_c": "5",
                    "option_d": "6",
                    "correct_option": "B",
                    "order_index": 0
                }
            ]
        }, timeout=60.0)
        r.raise_for_status()
        quiz = r.json()
        quiz_id = quiz["id"]
        question_id = quiz["questions"][0]["id"]
        
        print("Creating session...")
        r2 = await client.post(f"{BASE_URL}/api/sessions/", json={"quiz_id": quiz_id}, timeout=60.0)
        r2.raise_for_status()
        session = r2.json()
        return session["session_code"], session["join_token"], question_id
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def join_student(client, join_token, i):
    try:
        r = await client.post(f"{BASE_URL}/api/sessions/join/{join_token}", json={
            "name": f"Bot {i}",
            "university_id": f"BOT-{i}"
        }, timeout=60.0)
        if r.status_code == 200:
            return r.json()["student_id"]
        else:
            print(f"Failed to join student {i}: HTTP {r.status_code}")
            return None
    except Exception as e:
        print(f"Failed to join student {i}: {e}")
        return None

async def run_student(session_code, student_id):
    ws_url = f"{WS_URL}/ws/session/{session_code}/student/{student_id}"
    try:
        async with websockets.connect(ws_url, ping_interval=None, open_timeout=60.0) as ws:
            # Wait for question_started
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=40.0)
                except asyncio.TimeoutError:
                    print(f"Bot {student_id} timed out waiting for question_started")
                    return False
                data = json.loads(msg)
                if data.get("type") == "question_started":
                    break
            
            # Read question ID
            q_id = data["question"]["question_id"]
            
            # Wait for options_revealed
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=40.0)
                except asyncio.TimeoutError:
                    print(f"Bot {student_id} timed out waiting for options_revealed")
                    return False
                data = json.loads(msg)
                if data.get("type") == "options_revealed":
                    break
            
            # Random wait (1-3s) to simulate reading
            await asyncio.sleep(random.uniform(1, 3))
            
            # Submit answer (always A)
            await ws.send(json.dumps({
                "type": "submit_answer",
                "question_id": q_id,
                "selected_option": "A"
            }))
            
            # Wait for results
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=40.0)
                except asyncio.TimeoutError:
                    print(f"Bot {student_id} timed out waiting for results_revealed")
                    return False
                data = json.loads(msg)
                if data.get("type") == "results_revealed":
                    break
            return True
    except asyncio.TimeoutError:
        print(f"Bot {student_id} timed out waiting for server message")
        return False
    except Exception as e:
        print(f"Bot {student_id} connection error: {e}")
        return False

async def run_teacher(session_code, token, num_bots):
    url = f"{WS_URL}/ws/session/{session_code}/teacher?token={token}"
    try:
        async with websockets.connect(url, ping_interval=None, open_timeout=60.0) as ws:
            print("Teacher connected. Waiting 30s for bots to establish WebSocket connections...")
            
            async def listen_teacher():
                try:
                    while True:
                        msg = await ws.recv()
                        print(f"Teacher received: {msg}")
                except Exception as e:
                    pass

            listen_task = asyncio.create_task(listen_teacher())
            
            await asyncio.sleep(30)
            
            print("Teacher sending 'next_question'...")
            await ws.send(json.dumps({"type": "next_question"}))
            
            print("Teacher waiting 3s then sending 'reveal_options'...")
            await asyncio.sleep(3)
            await ws.send(json.dumps({"type": "reveal_options"}))
            
            print("Teacher waiting 6s for bots to answer...")
            await asyncio.sleep(6)
            
            print("Teacher sending 'show_results'...")
            await ws.send(json.dumps({"type": "show_results"}))
            
            print("Teacher waiting 3s then ending session...")
            await asyncio.sleep(3)
            await ws.send(json.dumps({"type": "end_session"}))
            
            listen_task.cancel()
            print("Teacher flow complete.")
            return True
    except Exception as e:
        print(f"Teacher WS error: {e}")
        sys.exit(1)

async def main():
    if len(sys.argv) > 1:
        NUM_BOTS = int(sys.argv[1])
    else:
        NUM_BOTS = 50
        
    print(f"Starting End-to-End Load Test with {NUM_BOTS} bots against {BASE_URL}")
    
    async with httpx.AsyncClient() as client:
        token = await register_teacher(client)
        session_code, join_token, question_id = await create_quiz_and_session(client, token)
        
        print(f"Session [{session_code}] created. Joining {NUM_BOTS} students via API...")
        
        # Join students via HTTP with limited concurrency to avoid DB pool exhaustion
        sem = asyncio.Semaphore(5)
        async def bounded_join(idx):
            async with sem:
                await asyncio.sleep(random.uniform(0.1, 0.5))
                return await join_student(client, join_token, idx)
                
        join_tasks = [bounded_join(i+1) for i in range(NUM_BOTS)]
        student_ids = await asyncio.gather(*join_tasks)
        student_ids = [s for s in student_ids if s is not None]
        
        if not student_ids:
            print("Failed to join any students. Aborting test.")
            return
            
        print(f"{len(student_ids)}/{NUM_BOTS} students joined successfully. Connecting WebSockets...")
        
        # Run teacher in the background so it connects FIRST
        teacher_task = asyncio.create_task(run_teacher(session_code, token, len(student_ids)))
        await asyncio.sleep(1) # Give teacher 1 second to connect
        
        # Start all student websocket tasks with a slight stagger (150ms) to simulate real-world joining
        bot_tasks = []
        for s_id in student_ids:
            bot_tasks.append(asyncio.create_task(run_student(session_code, s_id)))
            await asyncio.sleep(0.15)
        
        # Wait for teacher to finish its flow first
        await teacher_task
        
        # Give bots a tiny bit of time to receive the final message
        await asyncio.sleep(2)
        
        # Wait for bots to finish
        results = await asyncio.gather(*bot_tasks)
        
        success_count = sum(1 for r in results if r)
        print(f"\n==============================")
        print(f"--- LOAD TEST RESULTS ---")
        print(f"Successful bots: {success_count} / {NUM_BOTS}")
        print(f"Failed bots:     {NUM_BOTS - success_count} / {NUM_BOTS}")
        print(f"==============================")
        
        if success_count == NUM_BOTS:
            print("[PASS] TEST PASSED: All 50 bots successfully completed the full quiz lifecycle.")
        else:
            print("[WARN] TEST WARNING: Some bots failed to complete the lifecycle. See logs above.")

if __name__ == "__main__":
    asyncio.run(main())
