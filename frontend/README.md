# AI Interview Frontend (Voice-only)
## Setup
1. Extract the ZIP.
2. Install dependencies:
   npm install
3. Start dev server:
   npm run dev
4. Open browser at the printed local URL (usually http://localhost:5173)

This frontend expects your backend to run at http://127.0.0.1:8000 with the endpoints:
- GET  /api/next_question?prev_answer=
- POST /api/transcribe (multipart form-data key: file)
- POST /api/evaluate (JSON { answer: string })
