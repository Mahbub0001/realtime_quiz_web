# Real-time Quiz Platform Backend

## Setup & Running

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Mac/Linux: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

6. Seed the database with sample data:
   ```bash
   python -m app.seed
   ```
   *This creates a sample teacher (`teacher@example.com` / `password123`) and a 5-question quiz.*

7. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`. You can test it by checking the health endpoint: `http://localhost:8000/health`.
