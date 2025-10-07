from pydantic import BaseModel
from typing import Any

class TranscribeResponse(BaseModel):
    text: str

class QuestionResponse(BaseModel):
    question: str

class EvaluateRequest(BaseModel):
    answer: str

class EvaluateResponse(BaseModel):
    evaluation: Any  # Use Any to support JSON/dict or string returned by Groq
