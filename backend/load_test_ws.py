import asyncio
import websockets
import sys

async def connect_student(session_code, student_id):
    """
    Connects a simulated student to the WebSocket session and holds the connection.
    """
    url = f"ws://localhost:8000/ws/session/{session_code}/student/{student_id}"
    try:
        async with websockets.connect(url) as ws:
            # Keep connection open for a short period to simulate active players
            await asyncio.sleep(5)
            return True
    except Exception as e:
        print(f"Student {student_id} failed to connect: {e}")
        return False

async def main():
    if len(sys.argv) < 2:
        print("Usage: python load_test_ws.py <session_code>")
        print("Example: python load_test_ws.py ABCDEF")
        sys.exit(1)

    session_code = sys.argv[1]
    num_students = 100
    
    print(f"Starting load test...")
    print(f"Attempting to connect {num_students} concurrent students to session [{session_code}]")
    print("Please wait...")

    # Spin up concurrent WebSocket connection tasks
    tasks = [connect_student(session_code, i) for i in range(1, num_students + 1)]
    
    # Run them all concurrently
    results = await asyncio.gather(*tasks)

    success_count = sum(1 for r in results if r)
    failure_count = num_students - success_count

    print("\n--- Load Test Results ---")
    print(f"Successful connections: {success_count} / {num_students}")
    print(f"Failed connections:     {failure_count} / {num_students}")
    
    if failure_count == 0:
        print("\n✅ Load test passed! The system successfully handled 100 concurrent connections.")
    else:
        print("\n⚠️ Load test completed with failures. Check server logs.")

if __name__ == "__main__":
    asyncio.run(main())
