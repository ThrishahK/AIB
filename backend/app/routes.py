import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from .groq_client import transcribe_audio_bytes, generate_question, evaluate_answer
from .schemas import TranscribeResponse, QuestionResponse, EvaluateRequest, EvaluateResponse
from .db import save_entry
import json

router = APIRouter()

# -------------------------------
# POST /api/transcribe
# -------------------------------
@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        contents = await file.read()
        tmp_file.write(contents)
        tmp_file_path = tmp_file.name

    try:
        text = transcribe_audio_bytes(tmp_file_path)
        print(f"🗣️ Transcribed text: {text}")  # 👈 Add this line
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(tmp_file_path)
        except Exception:
            pass

    return {"text": text}


# -------------------------------
# GET /api/next_question
# -------------------------------
# GET /api/next_question
@router.get("/next_question", response_model=QuestionResponse)
def next_question(prev_answer: str = ""):
    try:
        q = generate_question(prev_answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate question: {str(e)}")
    return {"question": q}

# -------------------------------
# POST /api/evaluate
# -------------------------------
@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest):
    try:
        evaluation = evaluate_answer(req.answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
    
    try:
        save_entry(question="", answer=req.answer, evaluation=json.dumps(evaluation))
    except Exception as e:
        print(f"Warning: Failed to save to DB: {str(e)}")
    
    # Return the parsed evaluation (dict) directly — not a JSON string
    return {"evaluation": evaluation}

